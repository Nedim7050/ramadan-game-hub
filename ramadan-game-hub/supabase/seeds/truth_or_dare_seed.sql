-- Table pour stocker les cartes Action/Vérité
create table if not exists truth_or_dare_cards (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('truth','dare')),
  content text not null
);

-- Exemples de cartes Vérité
insert into truth_or_dare_cards (type, content) values
('truth', 'Quelle est ta plus grande peur ?'),
('truth', 'Quel est ton plus grand rêve ?'),
('truth', 'As-tu déjà menti à un ami proche ?');

-- Exemples de cartes Action
insert into truth_or_dare_cards (type, content) values
('dare', 'Fais 10 pompes'),
('dare', 'Chante le refrain de ta chanson préférée'),
('dare', 'Danse sans musique pendant 30 secondes');