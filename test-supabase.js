// Simple test script to verify Supabase connection
// Run with: node test-supabase.js

import { createClient } from '@supabase/supabase-js'

// Hardcoded values for testing (remove after verification)
const supabaseUrl = 'https://gqhmfayztjhgnmucilpa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaG1mYXl6dGpoZ25tdWNpbHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjM1NTEsImV4cCI6MjA3MTUzOTU1MX0.3qkNvb9CihRt4pTLa0jAIv85fZSRa9llZQx55foFRQE'

console.log('Testing Supabase Configuration...')
console.log('URL:', supabaseUrl)
console.log('Key Length:', supabaseKey.length)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔍 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('sales')
      .select('count')
      .limit(1)

    if (error) {
      if (error.message.includes('relation "public.sales" does not exist')) {
        console.log('⚠️  Connection successful, but tables not created yet')
        console.log('📝 Please run the SQL in supabase_setup.sql in your Supabase SQL Editor')
        return true
      } else {
        console.error('❌ Connection failed:', error.message)
        return false
      }
    }

    console.log('✅ Supabase connection successful!')
    console.log('📊 Sales table is accessible')
    return true
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase is configured correctly!')
    console.log('💡 Your app will now use Supabase instead of localStorage')
  } else {
    console.log('\n❌ Please check your Supabase configuration')
  }
})