-- Piglet data for 10 currently nursing litters
-- Based on farrowings from November 2025
-- Birth weights in kg (typical range: 1.2-1.8 kg)

-- Sow 001 (ear_tag '001') - 12 live piglets, farrowed 2025-11-10
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.2, 'alive', NULL::DATE, NULL::DATE, 'Runt - needs monitoring' FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 1.8, 'alive', NULL::DATE, NULL::DATE, 'Largest in litter' FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10';

-- Sow 002 (ear_tag '002') - 11 live piglets, farrowed 2025-11-11
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11';

-- Sow 003 (ear_tag '003') - 10 live piglets, farrowed 2025-11-12
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12';

-- Sow 004 (ear_tag '004') - 13 live piglets, farrowed 2025-11-13
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13'
UNION ALL SELECT f.id, 1.2, 'alive', NULL, NULL, 'Small but vigorous' FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13';

-- Sow 005 (ear_tag '005') - 11 live piglets, farrowed 2025-11-14
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.8, 'alive', NULL, NULL, 'Strong piglet' FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14';

-- Sow 006 (ear_tag '006') - 12 live piglets, farrowed 2025-11-15
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15';

-- Sow 007 (ear_tag '007') - 10 live piglets, farrowed 2025-11-15
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15';

-- Sow 008 (ear_tag '008') - 11 live piglets, farrowed 2025-11-14
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14';

-- Sow 009 (ear_tag '009') - 13 live piglets, farrowed 2025-11-15
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15'
UNION ALL SELECT f.id, 1.8, 'alive', NULL, NULL, 'Premium quality' FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15';

-- Sow 010 (ear_tag '010') - 11 live piglets, farrowed 2025-11-14
INSERT INTO piglets (farrowing_id, birth_weight, status, died_date, weaned_date, notes)
SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.7, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.3, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.4, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.5, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.6, 'alive', NULL::DATE, NULL::DATE, NULL::TEXT FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14'
UNION ALL SELECT f.id, 1.7, 'alive', NULL, NULL, 'Excellent condition' FROM farrowings f JOIN sows s ON f.sow_id = s.id WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14';

-- Summary:
-- Total piglets nursing: 114 piglets
-- Sow 001: 12 piglets
-- Sow 002: 11 piglets
-- Sow 003: 10 piglets
-- Sow 004: 13 piglets
-- Sow 005: 11 piglets
-- Sow 006: 12 piglets
-- Sow 007: 10 piglets
-- Sow 008: 11 piglets
-- Sow 009: 13 piglets
-- Sow 010: 11 piglets
