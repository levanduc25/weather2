import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiToggleLeft, FiToggleRight, FiSave, FiX } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SettingsContainer = styled.div`
  padding: 100px 20px 40px 20px;
  max-width: 900px;
  margin: 0 auto;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--background-color) 0%, var(--card-background) 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
  position: relative;

  h1 {
    font-size: 2.8rem;
    margin-bottom: 10px;
    color: var(--text-color);
    text-align: center;
    font-weight: 700;
  }

  .subtitle {
    text-align: center;
    color: var(--text-color);
    opacity: 0.7;
    margin-bottom: 40px;
    font-size: 1.1rem;
  }

  h2 {
    font-size: 1.6rem;
    margin-top: 50px;
    margin-bottom: 25px;
    color: var(--primary-accent);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--primary-accent);
    opacity: 0.9;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: var(--text-color);
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  z-index: 1000;
  backdrop-filter: blur(4px);

  &:hover {
    opacity: 1;
    transform: scale(1.1);
    background: var(--card-background);
    box-shadow: var(--shadow-md);
  }

  @media (max-width: 768px) {
    top: 20px;
    right: 20px;
  }
`;

const SettingGroup = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
`;

const SettingItem = styled(motion.div)`
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-accent);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
`;

const SettingLabel = styled.label`
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SettingDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.7;
  margin: 5px 0 0 0;
`;

const ToggleSwitch = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 60px;
  height: 32px;
  background: ${props => props.checked ? 'var(--success-color)' : 'var(--transparent-bg)'};
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 2px;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 16px;

  &:hover {
    background: ${props => props.checked ? 'var(--success-color)' : 'var(--hover-bg)'};
  }

  svg {
    margin: 0 4px;
    color: ${props => props.checked ? 'white' : 'var(--text-color)'};
  }
`;

const TimeInput = styled.input`
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--transparent-bg);
  color: var(--text-color);
  font-size: 1rem;
  transition: all var(--transition-fast);
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
    background: var(--card-background);
  }
`;

const SaveButton = styled.button`
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--primary-accent) 0%, var(--secondary-accent) 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  box-shadow: var(--shadow-md);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Load user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserEmail(user.email || '');

    // Load notification settings from localStorage
    const storedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
    if (storedNotificationsEnabled !== null) {
      setNotificationsEnabled(JSON.parse(storedNotificationsEnabled));
    }

    const storedNotificationTime = localStorage.getItem('notificationTime');
    if (storedNotificationTime) {
      setNotificationTime(storedNotificationTime);
    }

    // Fetch user settings from server if logged in
    if (user.email) {
      fetchUserSettings();
    }
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.discord) {
        setNotificationsEnabled(response.data.discord.subscribed || false);
        setNotificationTime(response.data.discord.notificationTime || '09:00');
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
      return newValue;
    });
  };

  const handleNotificationTimeChange = (e) => {
    const { value } = e.target;
    setNotificationTime(value);
    localStorage.setItem('notificationTime', value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setSaveMessage('Please log in to save settings');
        setIsSaving(false);
        return;
      }

      // Save settings to server
      await axios.put(
        'http://localhost:5000/api/user/settings',
        {
          notificationsEnabled,
          notificationTime
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsContainer>
      <CloseButton onClick={() => navigate('/')} title="Close Settings">
        <FiX />
      </CloseButton>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>⚙️ Settings</h1>
        <p className="subtitle">Customize your Weather App experience</p>

        <h2>🎨 Appearance</h2>
        <SettingGroup>
          <SettingItem
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <SettingLabel>
                {theme === 'light' ? '☀️' : '🌙'} Dark Mode
              </SettingLabel>
              <SettingDescription>
                {theme === 'light' ? 'Switch to dark theme for better visibility at night' : 'Switch to light theme'}
              </SettingDescription>
            </div>
            <ToggleSwitch
              checked={theme === 'dark'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <FiToggleRight /> : <FiToggleLeft />}
            </ToggleSwitch>
          </SettingItem>
        </SettingGroup>

        <h2>🔔 Notifications</h2>
        <SettingGroup>
          <SettingItem
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <SettingLabel>Enable Notifications</SettingLabel>
              <SettingDescription>
                Receive daily weather updates at your preferred time
              </SettingDescription>
            </div>
            <ToggleSwitch
              checked={notificationsEnabled}
              onClick={handleNotificationsToggle}
            >
              {notificationsEnabled ? <FiToggleRight /> : <FiToggleLeft />}
            </ToggleSwitch>
          </SettingItem>

          {notificationsEnabled && (
            <SettingItem
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              whileHover={{ scale: 1.01 }}
            >
              <div>
                <SettingLabel>Notification Time</SettingLabel>
                <SettingDescription>
                  Choose when you want to receive daily weather notifications
                </SettingDescription>
              </div>
              <TimeInput
                type="time"
                value={notificationTime}
                onChange={handleNotificationTimeChange}
              />
            </SettingItem>
          )}
        </SettingGroup>
        
        <SaveButton onClick={handleSave} disabled={isSaving}>
          <FiSave /> {isSaving ? 'Saving...' : 'Save All Settings'}
        </SaveButton>

        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginTop: '15px',
              padding: '12px 16px',
              background: saveMessage.includes('Error') ? '#dc3545' : 'var(--success-color)',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            {saveMessage}
          </motion.div>
        )}
      </motion.div>
    </SettingsContainer>
  );
};

export default Settings;