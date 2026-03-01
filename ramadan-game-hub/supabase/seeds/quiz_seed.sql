-- Table pour stocker les questions de quiz multi‑thèmes
create table if not exists quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  theme text not null,
  question text not null,
  options text[] not null,
  answer_index integer not null
);

-- Exemple de questions
insert into quiz_questions (theme, question, options, answer_index) values
('Culture générale', 'Quelle est la capitale de la Tunisie ?', ARRAY['Tunis','Sfax','Sousse','Bizerte'], 1),
('Tech', 'Qui a inventé le langage JavaScript ?', ARRAY['Brendan Eich','Linus Torvalds','Guido van Rossum','James Gosling'], 1),
('Sport', 'Combien de joueurs composent une équipe de football ?', ARRAY['9','10','11','12'], 3),
('Ramadan', 'Combien de jours dure le mois de Ramadan ?', ARRAY['28','29 ou 30','31','27'], 2),
('Tunisie', 'Quelle ville est surnommée la perle du Sahel ?', ARRAY['Monastir','Sousse','Hammamet','Djerba'], 2);