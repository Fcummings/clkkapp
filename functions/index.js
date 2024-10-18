const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendMoney = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to send money.');
  }

  const { amount, recipientEmail, senderId } = data;
  const db = admin.firestore();

  try {
    const senderDoc = await db.collection('users').doc(senderId).get();
    const recipientQuery = await db.collection('users').where('email', '==', recipientEmail).limit(1).get();

    if (recipientQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Recipient not found.');
    }

    const recipientDoc = recipientQuery.docs[0];

    if (senderDoc.data().balance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds.');
    }

    await db.runTransaction(async (transaction) => {
      // Update sender's balance
      transaction.update(senderDoc.ref, {
        balance: admin.firestore.FieldValue.increment(-amount)
      });

      // Update recipient's balance
      transaction.update(recipientDoc.ref, {
        balance: admin.firestore.FieldValue.increment(amount)
      });

      // Create transaction records
      const transactionData = {
        amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(db.collection('transactions').doc(), {
        ...transactionData,
        type: 'send',
        userId: senderId,
        recipientEmail,
      });

      transaction.set(db.collection('transactions').doc(), {
        ...transactionData,
        type: 'receive',
        userId: recipientDoc.id,
        senderEmail: senderDoc.data().email,
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error in sendMoney function:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while sending money.');
  }
});

exports.requestMoney = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to request money.');
  }

  const { amount, fromEmail, requesterId } = data;
  const db = admin.firestore();

  try {
    const requesterDoc = await db.collection('users').doc(requesterId).get();
    const fromUserQuery = await db.collection('users').where('email', '==', fromEmail).limit(1).get();

    if (fromUserQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'User to request money from not found.');
    }

    const fromUserDoc = fromUserQuery.docs[0];

    const requestData = {
      amount,
      requesterId,
      requesterEmail: requesterDoc.data().email,
      fromEmail,
      fromUserId: fromUserDoc.id,
      status: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('moneyRequests').add(requestData);

    return { success: true };
  } catch (error) {
    console.error('Error in requestMoney function:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while requesting money.');
  }
});

exports.handleMoneyRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to handle money requests.');
  }

  const { requestId, action } = data;
  const db = admin.firestore();

  try {
    const requestDoc = await db.collection('moneyRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Money request not found.');
    }

    const requestData = requestDoc.data();
    if (requestData.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'This request has already been processed.');
    }

    if (action === 'approve') {
      // Perform the money transfer
      const senderDoc = await db.collection('users').doc(context.auth.uid).get();
      const recipientDoc = await db.collection('users').doc(requestData.requesterId).get();

      if (senderDoc.data().balance < requestData.amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds.');
      }

      await db.runTransaction(async (transaction) => {
        // Update sender's balance
        transaction.update(senderDoc.ref, {
          balance: admin.firestore.FieldValue.increment(-requestData.amount)
        });

        // Update recipient's balance
        transaction.update(recipientDoc.ref, {
          balance: admin.firestore.FieldValue.increment(requestData.amount)
        });

        // Create transaction records
        const transactionData = {
          amount: requestData.amount,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        transaction.set(db.collection('transactions').doc(), {
          ...transactionData,
          type: 'send',
          userId: context.auth.uid,
          recipientEmail: requestData.requesterEmail,
        });

        transaction.set(db.collection('transactions').doc(), {
          ...transactionData,
          type: 'receive',
          userId: requestData.requesterId,
          senderEmail: senderDoc.data().email,
        });

        // Update request status
        transaction.update(requestDoc.ref, { status: 'approved' });
      });
    } else if (action === 'reject') {
      // Update request status to rejected
      await requestDoc.ref.update({ status: 'rejected' });
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid action. Must be "approve" or "reject".');
    }

    return { success: true };
  } catch (error) {
    console.error('Error in handleMoneyRequest function:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while processing the money request.');
  }
});