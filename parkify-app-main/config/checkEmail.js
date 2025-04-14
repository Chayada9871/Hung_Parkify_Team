import supabase from './supabaseClient';

// Function to check if an email exists
export const checkEmailExists = async (email) => {
    const sql = `
      SELECT email
      FROM user_info
      WHERE email = $1
      LIMIT 1
    `;
  
    // Call the execute_sql RPC function
    const { data, error } = await supabase.rpc('execute_sql', {
      sql, // Pass the SQL query string
      args: [email] // Pass parameters as an array
    });
  
    if (error) {
      console.error('Error checking email:', error.message);
      return { exists: false, error };
    }
  
    return { exists: data.length > 0, error: null };
  };
  
  // Function to register a new user
  export const registerUser = async (email, password) => {
    const sql = `
      INSERT INTO user_info (email, password)
      VALUES ($1, $2)
    `;
  
    const { data, error } = await supabase.rpc('execute_sql', {
      sql, // Pass the SQL query string
      args: [email, password] // Pass parameters as an array
    });
  
    if (error) {
      console.error('Error during registration:', error.message);
      return { user: null, error };
    }
  
    return { user: data, error: null };
  };
  