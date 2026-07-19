/*
    Banking System - SQL Server database bootstrap
    Run this script first in SQL Server Management Studio (SSMS).

    Change YonoBank in this file and the USE statements in the remaining
    scripts if a different database name is required.
*/

USE [master];
GO

IF DB_ID(N'YonoBank') IS NULL
BEGIN
    PRINT N'Creating database [YonoBank]...';
    EXEC(N'CREATE DATABASE [YonoBank];');
END
ELSE
BEGIN
    PRINT N'Database [YonoBank] already exists; no destructive action was taken.';
END;
GO

USE [YonoBank];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
