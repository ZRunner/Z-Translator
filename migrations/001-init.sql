-- Up 
CREATE TABLE `users` (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  `nickname` VARCHAR(50) NOT NULL,
  `password` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `minecraft-name` TEXT,
  `minecraft-uuid` TEXT,
  `discord-id` BIGINT,
  `github-`
);
CREATE UNIQUE INDEX idx_accounts_email ON `users` (`email`);
CREATE INDEX idx_accounts_nickname ON `users` (`nickname`);
 
-- Down 
DROP TABLE IF EXISTS `users`;