const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'mock-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
