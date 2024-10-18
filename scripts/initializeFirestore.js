const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeCollections() {
  try {
    // Initialize transactions collection
    const transactionsRef = db.collection('transactions');
    await transactionsRef.add({
      type: 'send',
      amount: 50,
      userId: 'sampleUserId1',
      recipientEmail: 'recipient@example.com',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Transactions collection initialized');

    // Initialize moneyRequests collection
    const moneyRequestsRef = db.collection('moneyRequests');
    await moneyRequestsRef.add({
      amount: 25,
      requesterId: 'sampleUserId2',
      requesterEmail: 'requester@example.com',
      fromEmail: 'sender@example.com',
      fromUserId: 'sampleUserId3',
      status: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('MoneyRequests collection initialized');

    console.log('All collections have been initialized successfully');
  } catch (error) {
    console.error('Error initializing collections:', error);
  } finally {
    admin.app().delete();
  }
}

initializeCollections();