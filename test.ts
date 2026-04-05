import { supabase } from './src/integrations/supabase/client';

async function test() {
  const { data, error } = await supabase.from('orders').insert({
    number: 999,
    customer_name: 'Test',
    address: '',
    phone: '',
    cnpj: null,
    delivery_fee: 0,
    total_amount: 0,
    change_for: 0,
    status: 'preparing',
    payment_method: 'cash',
    is_printed: true,
    observation: 'testing'
  }).select();
  
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

test();
