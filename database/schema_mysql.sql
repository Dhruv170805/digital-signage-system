-- Database Schema for Digital Signage System
-- Targeted for MySQL

CREATE DATABASE IF NOT EXISTS DigitalSignageDB;
USE DigitalSignageDB;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' -- admin, user
);

-- Media Table
CREATE TABLE IF NOT EXISTS Media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fileName VARCHAR(255) NOT NULL,
    filePath VARCHAR(500) NOT NULL, 
    fileType VARCHAR(50) NOT NULL, -- pdf, image
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates Table
CREATE TABLE IF NOT EXISTS Templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    layout JSON
);

-- Schedule Table
CREATE TABLE IF NOT EXISTS Schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mediaId INT,
    templateId INT,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    duration INT NOT NULL, -- duration in seconds
    isActive TINYINT(1) DEFAULT 1,
    FOREIGN KEY (mediaId) REFERENCES Media(id),
    FOREIGN KEY (templateId) REFERENCES Templates(id)
);

-- Ticker Table
CREATE TABLE IF NOT EXISTS Tickers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    text LONGTEXT NOT NULL,
    speed INT DEFAULT 5,
    isActive TINYINT(1) DEFAULT 1
);
