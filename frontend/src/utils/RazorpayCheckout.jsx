import api from '../lib/api.js';
import toast from 'react-hot-toast';

export const handleRazorpayPayment = async (user, onSuccess) => {
  if (!user) {
     toast.error('You must be logged in to upgrade');
     return;
  }

  try {
     const resData = await api.post(`/payment/create-order`, {});
     const order = resData.data;

     const options = {
        key: 'rzp_test_SaU1DVYVXU1fwJ', // Development test key
        amount: order.amount,
        currency: order.currency,
        name: "Tradezy",
        description: "Upgrade to Premium Tier",
        order_id: order.id,
        handler: async function (response) {
            try {
               await api.post('http://localhost:5000/api/payment/verify', {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
               }, { headers: { 'x-user-id': user.id || 'mock-id' } });

               toast.success('Successfully upgraded to Premium! 🎉');
               if (onSuccess) onSuccess();
            } catch (err) {
               toast.error('Payment Verification Failed');
            }
        },
        prefill: {
            name: user.email?.split('@')[0],
            email: user.email,
        },
        theme: {
            color: "#3b82f6"
        }
     };

     if (window.Razorpay) {
         const rzp1 = new window.Razorpay(options);
         rzp1.on('payment.failed', function (response){
            toast.error(response.error.description);
         });
         rzp1.open();
     } else {
         toast.error('Razorpay SDK failed to load. Are you online?');
     }
  } catch(e) {
     toast.error("Failed to initiate payment");
     console.error(e);
  }
};
