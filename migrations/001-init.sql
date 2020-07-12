-- Up 
CREATE TABLE `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `nickname` VARCHAR(50) NOT NULL,
  `password` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `avatar-url` TEXT,
  `minecraft-name` TEXT,
  `minecraft-uuid` TEXT UNIQUE,
  `discord-id` BIGINT UNIQUE,
  `github-name` TEXT UNIQUE
);
CREATE UNIQUE INDEX idx_accounts_email ON `users` (`email`);
CREATE INDEX idx_accounts_nickname ON `users` (`nickname`);

CREATE TABLE `projects` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `owner` BIGINT,
  `git-url` TEXT NOT NULL,
  `git-path` TEXT NOT NULL,
  `last-update` TIMESTAMP,
  `last-commit` TEXT,
  `settings-path` TEXT
);
CREATE UNIQUE INDEX idx_accounts_email ON `projects` (`name`);
CREATE INDEX idx_accounts_nickname ON `projects` (`owner`);
 
-- Down 
DROP TABLE IF EXISTS `users`;