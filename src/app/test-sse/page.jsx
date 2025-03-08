"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './test.module.css';
import { createApiUrl } from '@/utils/apiUtils';

export default function TestSSE() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const [slug, setSlug] = useState('test-post');
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to SSE
  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      setStatus('connecting');
      const timestamp = new Date().getTime();
      const eventSource = new EventSource(`/api/sse?slug=${slug}&t=${timestamp}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setStatus('connected');
        addMessage('system', 'Connected to SSE server');
      };

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage('receive', JSON.stringify(data, null, 2));
        } catch (error) {
          addMessage('error', `Error parsing message: ${error.message}`);
        }
      });

      eventSource.onerror = (error) => {
        setStatus('error');
        addMessage('error', `Connection error: ${JSON.stringify(error)}`);
      };
    } catch (error) {
      setStatus('error');
      addMessage('error', `Error setting up SSE: ${error.message}`);
    }
  };

  // Disconnect from SSE
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
      addMessage('system', 'Disconnected from SSE server');
    }
  };

  // Send a test like event
  const sendTestLike = async () => {
    try {
      const res = await fetch(createApiUrl('/api/posts/like'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });
      
      const data = await res.json();
      addMessage('send', `Sent like request: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      addMessage('error', `Error sending like: ${error.message}`);
    }
  };

  // Add a message to the list
  const addMessage = (type, text) => {
    setMessages(prev => [...prev, { type, text, timestamp: new Date().toISOString() }]);
  };

  return (
    <div className={styles.container}>
      <h1>SSE Test Page</h1>
      
      <div className={styles.controls}>
        <div className={styles.inputGroup}>
          <label htmlFor="slug">Post Slug:</label>
          <input 
            id="slug" 
            type="text" 
            value={slug} 
            onChange={(e) => setSlug(e.target.value)} 
            className={styles.input}
          />
        </div>
        
        <div className={styles.buttons}>
          <button 
            onClick={connect} 
            className={`${styles.button} ${styles.connect}`}
            disabled={status === 'connected' || status === 'connecting'}
          >
            Connect
          </button>
          <button 
            onClick={disconnect} 
            className={`${styles.button} ${styles.disconnect}`}
            disabled={status === 'disconnected'}
          >
            Disconnect
          </button>
          <button 
            onClick={sendTestLike} 
            className={`${styles.button} ${styles.test}`}
            disabled={status !== 'connected'}
          >
            Send Test Like
          </button>
        </div>
        
        <div className={`${styles.status} ${styles[status]}`}>
          Status: {status}
        </div>
      </div>
      
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.type]}`}>
            <div className={styles.timestamp}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <pre className={styles.text}>{msg.text}</pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 