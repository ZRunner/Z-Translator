-- Up 
CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `nickname` VARCHAR(50) NOT NULL,
  `password` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `avatar-url` TEXT,
  `minecraft-name` TEXT,
  `minecraft-uuid` TEXT UNIQUE,
  `discord-id` BIGINT UNIQUE,
  `github-name` TEXT UNIQUE,
  `admin` BOOLEAN DEFAULT 0,
  `theme` SMALLINT DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_email ON `users` (`email`);
CREATE INDEX IF NOT EXISTS idx_accounts_nickname ON `users` (`nickname`);

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `owner` BIGINT,
  `git-url` TEXT NOT NULL,
  `git-path` TEXT NOT NULL,
  `last-update` TIMESTAMP,
  `last-commit` TEXT,
  `settings-path` TEXT,
  `files-path` TEXT,
  `public` BOOLEAN DEFAULT 0,
  `icon-url` TEXT,
  `origin-lang` VARCHAR(10) DEFAULT "en"
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_name ON `projects` (`name`);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON `projects` (`owner`);

CREATE TABLE IF NOT EXISTS `authorizations` (
  `project` INTEGER NOT NULL,
  `type` SMALLINT NOT NULL,
  `value` VARCHAR(200) NOT NULL,
  `languages` TEXT
);
CREATE INDEX IF NOT EXISTS idx_authorizations_project ON `authorizations` (`project`);

CREATE TABLE IF NOT EXISTS `historic` (
  `project` INTEGER NOT NULL,
  `language` VARCHAR(10) NOT NULL,
  `author` INTEGER NOT NULL,
  `key` VARCHAR(200) NOT NULL,
  `new-value` TEXT NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_historic_project ON `historic` (`project`);
CREATE INDEX IF NOT EXISTS idx_historic_author ON `historic` (`author`);
 
-- Down 
-- DROP TABLE IF EXISTS `users`;