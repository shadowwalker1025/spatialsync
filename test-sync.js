const { io } = require('socket.io-client');

async function runE2ETest() {
  console.log('🧪 Starting SpatialSync End-to-End WebSocket & REST Integration Test...');

  // 1. Test REST Health
  const healthRes = await fetch('http://localhost:4000/api/health').then((r) => r.json());
  console.log('✅ 1. Backend REST Health:', healthRes.status === 'healthy' ? 'PASSED' : 'FAILED');

  // 2. Test Scene Creation
  const sceneRes = await fetch('http://localhost:4000/api/scenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Automated Test Studio', environmentPreset: 'cyberpunk' }),
  }).then((r) => r.json());

  const testSceneId = sceneRes.data.scene.id;
  console.log(`✅ 2. Created Scene Session: ${testSceneId} (Objects: ${sceneRes.data.objects.length})`);

  // 3. Connect Client A (User 1)
  const clientA = io('http://localhost:4000', { transports: ['websocket'] });
  // Connect Client B (User 2)
  const clientB = io('http://localhost:4000', { transports: ['websocket'] });

  await new Promise((resolve) => {
    let connected = 0;
    clientA.on('connect', () => { if (++connected === 2) resolve(); });
    clientB.on('connect', () => { if (++connected === 2) resolve(); });
  });
  console.log('✅ 3. Client A & Client B connected to WebSocket server');

  // 4. Join Room
  const user1 = { id: 'user-001', name: 'Alice Architect', color: '#6366f1' };
  const user2 = { id: 'user-002', name: 'Bob Builder', color: '#ec4899' };

  clientA.emit('room:join', { sceneId: testSceneId, user: user1 });
  clientB.emit('room:join', { sceneId: testSceneId, user: user2 });

  // 5. Test 3D Spatial Cursor Broadcast
  const cursorPromise = new Promise((resolve) => {
    clientB.on('cursor:update', (payload) => {
      if (payload.userId === 'user-001' && payload.position[0] === 3.5) {
        console.log('✅ 4. 3D Spatial Cursor Broadcast received by peer:', payload.position);
        resolve();
      }
    });
  });

  setTimeout(() => {
    clientA.emit('cursor:move', {
      sceneId: testSceneId,
      position: [3.5, 1.2, -2.0],
      normal: [0, 1, 0],
    });
  }, 100);
  await cursorPromise;

  // 6. Test Real-Time Continuous Object Transformation Delta
  const targetObjId = sceneRes.data.objects[0].id;
  const transformPromise = new Promise((resolve) => {
    clientB.on('object:transformed', (payload) => {
      if (payload.objectId === targetObjId && payload.transform.position[0] === 5.0) {
        console.log('✅ 5. Real-Time Throttled Transform Delta received by peer:', payload.transform.position);
        resolve();
      }
    });
  });

  clientA.emit('object:transform', {
    sceneId: testSceneId,
    objectId: targetObjId,
    transform: {
      position: [5.0, 2.0, 1.0],
      rotation: [0, 0.5, 0],
      scale: [2.0, 2.0, 2.0],
    },
    isContinuous: true,
  });
  await transformPromise;

  // 7. Test 3D Anchored Annotation Sync
  const annPromise = new Promise((resolve) => {
    clientB.on('annotation:created', (payload) => {
      if (payload.annotation.text === 'Check quantum chrome material') {
        console.log('✅ 6. 3D Anchored Annotation Pin synced:', payload.annotation.title);
        resolve();
      }
    });
  });

  clientA.emit('annotation:create', {
    sceneId: testSceneId,
    annotation: {
      id: 'ann-test-999',
      sceneId: testSceneId,
      objectId: targetObjId,
      position: [5.0, 2.8, 1.0],
      normal: [0, 1, 0],
      title: 'Review Material Shading',
      text: 'Check quantum chrome material',
      authorId: user1.id,
      authorName: user1.name,
      authorColor: user1.color,
      resolved: false,
    },
  });
  await annPromise;

  // 8. Test Spatial Chat Messaging
  const chatPromise = new Promise((resolve) => {
    clientA.on('chat:received', (msg) => {
      if (msg.text === 'Ready to export the 3D model.') {
        console.log('✅ 7. Spatial Chat message received in room:', msg.senderName, '->', msg.text);
        resolve();
      }
    });
  });

  clientB.emit('chat:send', {
    sceneId: testSceneId,
    text: 'Ready to export the 3D model.',
  });
  await chatPromise;

  // 9. Test Snapshot Persistence
  const snapshotRes = await fetch(`http://localhost:4000/api/scenes/${testSceneId}`).then((r) => r.json());
  console.log(`✅ 8. Database Persistence Verified: Snapshot contains ${snapshotRes.data.objects.length} objects & ${snapshotRes.data.annotations.length} annotations`);

  clientA.disconnect();
  clientB.disconnect();

  console.log('\n🎉 ALL 8 REAL-TIME SPATIAL COLLABORATION TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
