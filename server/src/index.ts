import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocket } from './socket/roomManager';
import { setupGameEngine } from './socket/gameEngine';
import { supabaseAdmin } from './lib/supabase';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Adjust to specific frontend URL in production
        methods: ['GET', 'POST'],
    },
});
app.get('/api/ping', (req, res) => res.send('pong'));

app.post('/api/admin/updateScore', async (req, res) => {
    const { userId, newScore, currentScore, adminId } = req.body;
    // Verify admin locally before inserting blindly
    const { data: adminCheck } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', adminId).single();
    if (!adminCheck?.is_admin) return res.status(403).json({ error: "Unauthorized" });

    const delta = newScore - currentScore;
    if (delta !== 0) {
        await supabaseAdmin.from('points_ledger').insert([{ user_id: userId, delta_points: delta, reason: 'Admin Manual Override' }]);
    }
    res.json({ success: true });
});

app.post('/api/admin/deleteUser', async (req, res) => {
    const { userId, adminId } = req.body;
    const { data: adminCheck } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', adminId).single();
    if (!adminCheck?.is_admin) return res.status(403).json({ error: "Unauthorized" });

    try {
        // Manually clean up foreign keys because ON DELETE CASCADE is missing on certain tables
        await supabaseAdmin.from('points_ledger').delete().eq('user_id', userId);
        await supabaseAdmin.from('room_members').delete().eq('user_id', userId);
        await supabaseAdmin.from('match_results').update({ winner_user_id: null }).eq('winner_user_id', userId);

        // For rooms owned by this user, we must first delete their game sessions to avoid FK errors
        const { data: userRooms } = await supabaseAdmin.from('rooms').select('id').eq('owner_id', userId);
        if (userRooms && userRooms.length > 0) {
            const roomIds = userRooms.map(r => r.id);
            await supabaseAdmin.from('game_sessions').delete().in('room_id', roomIds);
            await supabaseAdmin.from('rooms').delete().in('id', roomIds);
        }

        // Must explicitly delete profile to avoid Postgres auth.users FK constraints if ON CASCADE is missing.
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;

        res.json({ success: true });
    } catch (err: any) {
        console.error("Delete user error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/data', async (req, res) => {
    const { adminId } = req.body;
    const { data: adminCheck } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', adminId).single();
    if (!adminCheck?.is_admin) return res.status(403).json({ error: "Unauthorized" });

    const { data: users } = await supabaseAdmin.from('leaderboard_view').select('*').order('total_points', { ascending: false });

    // Anonymize gossips by NOT fetching profiles
    const { data: gossips } = await supabaseAdmin.from('gossips').select('*').order('created_at', { ascending: false });

    res.json({ success: true, users: users || [], gossips: gossips || [] });
});

setupSocket(io);
setupGameEngine(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
