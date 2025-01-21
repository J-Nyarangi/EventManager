CREATE DATABASE IF NOT EXISTS `eventmanagement` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `eventmanagement`;

-- Table: eventregistrations
CREATE TABLE `eventregistrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `ticket_type` VARCHAR(255) NOT NULL,
    `quantity` INT NOT NULL,
    `payment_ref` VARCHAR(255),
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Table: events
CREATE TABLE `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `capacity` INT NOT NULL,
    `banner_image` VARCHAR(255)
);

-- Table: tickets
CREATE TABLE `tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT NOT NULL,
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`)
);

-- Table: users
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);