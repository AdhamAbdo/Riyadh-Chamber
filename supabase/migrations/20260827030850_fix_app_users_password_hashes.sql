/*
# Fix app_users seed password hashes

Updates the password_hash values for the two seed users to match
the output of the simpleHash() function used in the frontend.
*/

UPDATE app_users SET password_hash = 'a43a8f5f' WHERE id = 'USER-00001';
UPDATE app_users SET password_hash = '5ff5d445' WHERE id = 'USER-00002';
