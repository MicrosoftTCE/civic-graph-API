-- MySQL dump 10.13  Distrib 5.5.44, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: civicgraph
-- ------------------------------------------------------
-- Server version	5.5.44-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category_table`
--

DROP TABLE IF EXISTS `category_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_table` (
  `category_id` int(11) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  KEY `category_id` (`category_id`),
  KEY `entity_id` (`entity_id`),
  CONSTRAINT `category_table_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
  CONSTRAINT `category_table_ibfk_2` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `connection`
--

DROP TABLE IF EXISTS `connection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `connection` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_id1` int(11) DEFAULT NULL,
  `entity_id2` int(11) DEFAULT NULL,
  `details` varchar(500) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entity_id1` (`entity_id1`),
  KEY `entity_id2` (`entity_id2`),
  CONSTRAINT `connection_ibfk_1` FOREIGN KEY (`entity_id1`) REFERENCES `entity` (`id`),
  CONSTRAINT `connection_ibfk_2` FOREIGN KEY (`entity_id2`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1079 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `directionalconnection`
--

DROP TABLE IF EXISTS `directionalconnection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `directionalconnection` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `details` varchar(500) DEFAULT NULL,
  `giver_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `giver_id` (`giver_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `directionalconnection_ibfk_1` FOREIGN KEY (`giver_id`) REFERENCES `entity` (`id`),
  CONSTRAINT `directionalconnection_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `edit`
--

DROP TABLE IF EXISTS `edit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `edit` (
  `ip` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `edit_type` varchar(100) DEFAULT NULL,
  `edit_time` datetime DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `entity`
--

DROP TABLE IF EXISTS `entity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `entity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `entitytype` varchar(100) DEFAULT NULL,
  `influence` varchar(100) DEFAULT NULL,
  `employees` int(11) DEFAULT NULL,
  `url` varchar(100) DEFAULT NULL,
  `twitter_handle` varchar(100) DEFAULT NULL,
  `followers` int(11) DEFAULT NULL,
  `description` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=739 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `finance`
--

DROP TABLE IF EXISTS `finance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `finance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_id` int(11) DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entity_id` (`entity_id`),
  CONSTRAINT `finance_ibfk_1` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fundingconnection`
--

DROP TABLE IF EXISTS `fundingconnection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fundingconnection` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `amount` float DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `giver_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `giver_id` (`giver_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `fundingconnection_ibfk_1` FOREIGN KEY (`giver_id`) REFERENCES `entity` (`id`),
  CONSTRAINT `fundingconnection_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `keypeople_table`
--

DROP TABLE IF EXISTS `keypeople_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `keypeople_table` (
  `keyperson_id` int(11) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  KEY `keyperson_id` (`keyperson_id`),
  KEY `entity_id` (`entity_id`),
  CONSTRAINT `keypeople_table_ibfk_1` FOREIGN KEY (`keyperson_id`) REFERENCES `keyperson` (`id`),
  CONSTRAINT `keypeople_table_ibfk_2` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `keyperson`
--

DROP TABLE IF EXISTS `keyperson`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `keyperson` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=915 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_address` varchar(200) DEFAULT NULL,
  `address_line` varchar(100) DEFAULT NULL,
  `locality` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `country_code` varchar(2) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=786 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `location_table`
--

DROP TABLE IF EXISTS `location_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location_table` (
  `location_id` int(11) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  KEY `location_id` (`location_id`),
  KEY `entity_id` (`entity_id`),
  CONSTRAINT `location_table_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`),
  CONSTRAINT `location_table_ibfk_2` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-01-07 16:42:58
