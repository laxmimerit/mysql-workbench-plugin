-- Test data for the hidden test Workbench (throwaway server on 127.0.0.1:3310). Loaded by tests/testenv.ps1.
DROP DATABASE IF EXISTS kgptalkie_test;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `kgptalkie_test` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `kgptalkie_test`;
CREATE TABLE `sales` (
  `id` int NOT NULL,
  `month` date DEFAULT NULL,
  `region` varchar(20) DEFAULT NULL,
  `revenue` int DEFAULT NULL,
  `orders` int DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `sales` VALUES (1,'2026-01-01','North',1200,10,NULL),(2,'2026-02-01','North',1500,12,'{\"promo\":true,\"code\":\"WINTER\"}'),(3,'2026-03-01','South',900,8,'a | pipe'),(4,'2026-04-01','South',2100,19,'multi\nline'),(5,'2026-05-01','East',1750,15,'quote \"x\", comma');
CREATE TABLE `sales_copy` (
  `id` int NOT NULL,
  `month` date DEFAULT NULL,
  `region` varchar(20) DEFAULT NULL,
  `revenue` int DEFAULT NULL,
  `orders` int DEFAULT NULL,
  `note` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `students` (
  `id` int NOT NULL,
  `name` varchar(40) DEFAULT NULL,
  `city` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `students` VALUES (1,'Leena','Pune'),(2,'Arjun','Delhi'),(3,'Meera','Chennai');
