-- Enable password security settings including leaked password protection
UPDATE auth.config 
SET password_minimum_length = 8, 
    password_character_requirements = '["upper","lower","number","special"]',
    password_history_limit = 5,
    password_check_against_leaked_passwords = true
WHERE true;