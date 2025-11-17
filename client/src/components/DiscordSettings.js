import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiBell, FiBellOff, FiSettings, FiCheck } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { useWeather } from '../contexts/WeatherContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const DiscordContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  
  h3 {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const StatusCard = styled.div`
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  border: 1px solid ${props => props.connected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
  backdrop-filter: blur(5px);
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  
  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.connected ? '#22c55e' : '#ef4444'};
    box-shadow: ${props => props.connected ? '0 0 8px rgba(34, 197, 94, 0.8)' : '0 0 8px rgba(239, 68, 68, 0.8)'};
  }
  
  .status-text {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }
`;

const StatusInfo = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  line-height: 1.8;
  
  p {
    margin: 8px 0;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: ${props => props.variant === 'primary' 
    ? 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border: ${props => props.variant === 'primary' 
    ? 'none' 
    : '1px solid rgba(255, 255, 255, 0.3)'};
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  box-shadow: ${props => props.variant === 'primary' 
    ? '0 4px 15px rgba(88, 101, 242, 0.4)' 
    : 'none'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.variant === 'primary' 
      ? '0 6px 20px rgba(88, 101, 242, 0.6)' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 15px;
  margin-bottom: 15px;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #5865F2;
    background: rgba(88, 101, 242, 0.15);
    box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
  }
`;

const Label = styled.label`
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  display: block;
`;

const NotificationSettings = styled.div`
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 15px;
  padding: 25px;
  margin-top: 20px;
  border: 1px solid rgba(88, 101, 242, 0.2);
  backdrop-filter: blur(5px);
`;

const ConnectPanel = styled.div`
  background: #fff;
  color: var(--text-color);
  border-radius: 12px;
  padding: 0;
  margin-bottom: 20px;
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 6px 18px rgba(16,24,40,0.06);
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.div`
  color: white;
  font-size: 15px;
  font-weight: 500;
`;

const ToggleButton = styled.button`
  width: 56px;
  height: 30px;
  border-radius: 25px;
  background: ${props => props.active ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(255, 255, 255, 0.15)'};
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'};

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.active ? '30px' : '3px'};
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const DiscordSettings = () => {
  const [discordStatus, setDiscordStatus] = useState({
    connected: false,
    subscribed: false,
    notificationCity: null,
    lastNotification: null
  });
  const [loading, setLoading] = useState(false);
  const [discordUserId, setDiscordUserId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [notificationCity, setNotificationCity] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);
  const { searchCities } = useWeather();

  useEffect(() => {
    loadDiscordStatus();
  }, []);

  const loadDiscordStatus = async () => {
    try {
      const response = await api.get('/discord/status');
      setDiscordStatus(response.data.discord);
      setNotificationCity(response.data.discord.notificationCity || '');
    } catch (error) {
      console.error('Failed to load Discord status:', error);
    }
  };

  const handleConnectDiscord = async () => {
    if (!discordUserId || !channelId) {
      toast.error('Please enter Discord User ID and Channel ID');
      return;
    }

    try {
      setLoading(true);
      await api.post('/discord/connect', {
        discordUserId,
        channelId
      });
      
      toast.success('Discord account connected successfully!');
      await loadDiscordStatus();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to connect Discord account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!notificationCity) {
      toast.error('Please enter a city name');
      return;
    }

    try {
      setLoading(true);
      await api.post('/discord/subscribe', {
        city: notificationCity,
        lat: 0, // This would be fetched from weather API
        lon: 0  // This would be fetched from weather API
      });
      
      toast.success('Subscribed to Discord notifications!');
      await loadDiscordStatus();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to subscribe to notifications';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
  setLoading(true);
  await api.post('/discord/unsubscribe');
      
      toast.success('Unsubscribed from Discord notifications');
      await loadDiscordStatus();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to unsubscribe from notifications';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCity = async () => {
    if (!notificationCity) {
      toast.error('Please enter a city name');
      return;
    }

    try {
      setLoading(true);
      await api.put('/discord/update-city', {
        city: notificationCity
      });
      
      toast.success('Notification city updated!');
      await loadDiscordStatus();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update notification city';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DiscordContainer>
      <Header>
        <FaDiscord style={{ fontSize: '1.5rem', color: '#5865F2' }} />
        <h3>Discord Notifications</h3>
      </Header>

      <StatusCard connected={discordStatus.connected}>
        <StatusIndicator connected={discordStatus.connected}>
          <div className="status-dot" />
          <span className="status-text">
            {discordStatus.connected ? 'Connected' : 'Not Connected'}
          </span>
        </StatusIndicator>
        <StatusInfo>
          {discordStatus.connected ? (
            <>
              <p>✅ Discord account is connected</p>
              <p>📱 Notifications: {discordStatus.subscribed ? 'Enabled' : 'Disabled'}</p>
              {discordStatus.notificationCity && (
                <p>🌍 City: {discordStatus.notificationCity}</p>
              )}
              {discordStatus.lastNotification && (
                <p>⏰ Last notification: {new Date(discordStatus.lastNotification).toLocaleString()}</p>
              )}
            </>
          ) : (
            <p>Connect your Discord account to receive weather notifications</p>
          )}
        </StatusInfo>
      </StatusCard>

      {!discordStatus.connected ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Visual connect panel (collapsed) */}
          <ConnectPanel>
            <div style={{ padding: 20, minHeight: 160 }}>
              <Label style={{ fontSize: '1.05rem', marginBottom: '8px' }}>🔗 Not Connected</Label>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Connect your Discord account to receive weather notifications
              </div>
            </div>

            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="primary" onClick={() => setShowConnectForm(true)}>
                <FaDiscord style={{ fontSize: '1.2rem' }} />
                Connect Discord Account
              </Button>
            </div>
          </ConnectPanel>

          {/* Expandable form - shown when user clicks connect */}
          {showConnectForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(88, 101, 242, 0.2)', marginTop: 16 }}>
                <Label style={{ fontSize: '1.1rem', marginBottom: '20px' }}>🔗 Connect your Discord Account</Label>
                <Input
                  type="text"
                  placeholder="Enter your Discord User ID"
                  value={discordUserId}
                  onChange={(e) => setDiscordUserId(e.target.value)}
                />
                
                <Label>Channel ID (Optional - leave empty for DMs)</Label>
                <Input
                  type="text"
                  placeholder="Discord Channel ID"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button 
                    variant="primary" 
                    onClick={handleConnectDiscord}
                    disabled={loading}
                  >
                    <FaDiscord style={{ fontSize: '1.2rem' }} />
                    Connect Discord Account
                  </Button>
                  <Button onClick={() => setShowConnectForm(false)}>Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <NotificationSettings>
          <h4 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>
            Notification Settings
          </h4>
          
          <SettingRow>
            <SettingLabel>Hourly Weather Updates</SettingLabel>
            <ToggleButton
              active={discordStatus.subscribed}
              onClick={discordStatus.subscribed ? handleUnsubscribe : handleSubscribe}
            />
          </SettingRow>

          {discordStatus.subscribed && (
            <div>
              <Label>Notification City</Label>
              <Input
                type="text"
                placeholder="Enter city name for notifications"
                value={notificationCity}
                onChange={(e) => setNotificationCity(e.target.value)}
              />
              
              <Button 
                variant="primary" 
                onClick={handleUpdateCity}
                disabled={loading}
              >
                <FiCheck />
                Update City
              </Button>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <Button 
              variant="primary" 
              onClick={discordStatus.subscribed ? handleUnsubscribe : handleSubscribe}
              disabled={loading}
            >
              {discordStatus.subscribed ? (
                <>
                  <FiBellOff />
                  Unsubscribe
                </>
              ) : (
                <>
                  <FiBell />
                  Subscribe to Notifications
                </>
              )}
            </Button>
          </div>
        </NotificationSettings>
      )}

      <div style={{ marginTop: '25px', padding: '20px', background: 'rgba(88, 101, 242, 0.1)', borderRadius: '15px', border: '1px solid rgba(88, 101, 242, 0.2)' }}>
        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1.05rem', fontWeight: '600' }}>
          📋 Discord Bot Commands:
        </h4>
        <ul style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
          <li><code style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>/weather [city]</code> - Get current weather</li>
          <li><code style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>/forecast [city]</code> - Get 5-day forecast</li>
          <li><code style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>/subscribe [city]</code> - Subscribe to hourly updates</li>
          <li><code style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>/unsubscribe</code> - Stop notifications</li>
        </ul>
      </div>
    </DiscordContainer>
  );
};

export default DiscordSettings;
