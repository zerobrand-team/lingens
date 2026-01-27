import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmxoigvmlhyahufmrnot.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteG9pZ3ZtbGh5YWh1Zm1ybm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjU0NzMsImV4cCI6MjA4NDk0MTQ3M30.j24TTFurhE7UOT1YRRLgmbci-0kzrvOd2bc04GKdWVA'

export const supabase = createClient(supabaseUrl, supabaseKey)