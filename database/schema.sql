-- Database Schema for Digital Signage System
-- Targeted for Microsoft SQL Server (MSSQL)

CREATE DATABASE DigitalSignageDB;
GO

USE DigitalSignageDB;
GO

-- Users Table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' -- admin, user
);

-- Media Table
CREATE TABLE Media (
    id INT PRIMARY KEY IDENTITY(1,1),
    fileName VARCHAR(255) NOT NULL,
    filePath VARCHAR(500) NOT NULL,
    fileType VARCHAR(50) NOT NULL, -- pdf, image
    uploadedAt DATETIME DEFAULT GETDATE()
);

-- Schedule Table
CREATE TABLE Schedules (
    id INT PRIMARY KEY IDENTITY(1,1),
    mediaId INT FOREIGN KEY REFERENCES Media(id),
    templateId INT FOREIGN KEY REFERENCES Templates(id),
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    duration INT NOT NULL, -- duration in seconds for this item to show
    isActive BIT DEFAULT 1
);

-- Templates Table
CREATE TABLE Templates (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    layout JSON -- SQL Server 2016+ supports JSON. For older versions use NVARCHAR(MAX)
);

-- Ticker Table
CREATE TABLE Tickers (
    id INT PRIMARY KEY IDENTITY(1,1),
    text NVARCHAR(MAX) NOT NULL,
    speed INT DEFAULT 5,
    isActive BIT DEFAULT 1
);
