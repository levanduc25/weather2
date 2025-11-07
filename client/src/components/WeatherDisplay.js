import React, { memo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiThermometer, 
  FiDroplet, 
  FiWind, 
  FiEye,
  FiSunrise,
  FiSunset,
  FiCloud,
  FiCloudRain,
  FiSun,
  FiCloudSnow,
  FiZap,
  FiHeart
} from 'react-icons/fi';
import { useWeather } from '../contexts/WeatherContext';

const WeatherContainer = styled.div`
  width: 100%;
  color: white;
`;

const CurrentWeather = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const MainInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 10px;
`;

const Temperature = styled.div`
  font-size: 6rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 4rem;
  }
`;

const Location = styled.div`
  font-size: 2rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const DateTime = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 20px;
`;

const WeatherIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const WeatherDescription = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
`;

const FavoritesButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 20px auto;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const WeatherDetails = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
`;

const DetailsHeader = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const DetailIcon = styled.div`
  font-size: 1.5rem;
  color: ${props => props.color || 'white'};
`;

const DetailContent = styled.div`
  flex: 1;
`;

const DetailLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  color: black;
  margin-bottom: 5px;
`;

const DetailValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`;

const ForecastSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
`;

const ForecastHeader = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
`;

const HourlyForecast = styled.div`
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 10px;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const HourlyItem = styled.div`
  min-width: 120px;
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const HourlyTime = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 10px;
`;

const HourlyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const HourlyTemp = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`;

const HourlyCondition = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 5px;
`;

const DailyForecast = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

const DailyItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(5px);
  }
`;

const DailyDate = styled.div`
  font-size: 1rem;
  font-weight: 500;
  min-width: 100px;
`;

const DailyIcon = styled.div`
  font-size: 1.5rem;
  margin: 0 15px;
`;

const DailyCondition = styled.div`
  flex: 1;
  font-size: 0.9rem;
  opacity: 0.8;
`;

const DailyTemp = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 80px;
  text-align: right;
`;

const weatherIcons = {
  clear: { icon: FiSun, color: '#FFD700' },
  clouds: { icon: FiCloud, color: '#87CEEB' },
  rain: { icon: FiCloudRain, color: '#4682B4' },
  drizzle: { icon: FiCloudRain, color: '#4682B4' },
  snow: { icon: FiCloudSnow, color: '#E6E6FA' },
  thunderstorm: { icon: FiZap, color: '#FFD700' },
  default: { icon: FiCloud, color: '#87CEEB' },
};

const getWeatherIcon = (weatherMain, size = 'default') => {
  const iconSize = size === 'large' ? '4rem' : '2rem';
  const weather = weatherMain?.toLowerCase();
  const { icon: Icon, color } = weatherIcons[weather] || weatherIcons.default;
  
  return <Icon style={{ fontSize: iconSize, color }} />;
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

const WeatherDisplay = memo(({ weather, forecast, isDetailsPanel = false }) => {
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const { addToFavorites, favoriteCities } = useWeather();
  
  if (!weather) return null;

  const { current, location } = weather;
  const { hourly, daily } = forecast || {};
  
  // Check if current city is already in favorites
  const isInFavorites = favoriteCities?.some(fav => 
    fav.name === location.name && fav.country === location.country
  );
  
  const handleAddToFavorites = async () => {
    if (isAddingToFavorites || isInFavorites) return;
    
    setIsAddingToFavorites(true);
    try {
      await addToFavorites({
        name: location.name,
        country: location.country,
        lat: location.lat,
        lon: location.lon
      });
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  if (isDetailsPanel) {
    return (
      <WeatherContainer>
        <motion.div layout>
          <WeatherDetails>
          <DetailsHeader>Weather Details...</DetailsHeader>
          <WeatherDescription style={{ textAlign: 'center', marginBottom: '20px' }}>
            {current.weather.description}
          </WeatherDescription>
          
          <DetailsGrid>
            <DetailItem>
              <DetailIcon color="#ff6b6b">
                <FiThermometer />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Temp max</DetailLabel>
                <DetailValue>{Math.round(current.temperature + 3)}°</DetailValue>
              </DetailContent>
            </DetailItem>

            <DetailItem>
              <DetailIcon color="#4ecdc4">
                <FiThermometer />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Temp min</DetailLabel>
                <DetailValue>{Math.round(current.temperature - 3)}°</DetailValue>
              </DetailContent>
            </DetailItem>

            <DetailItem>
              <DetailIcon color="#45b7d1">
                <FiDroplet />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Humidity</DetailLabel>
                <DetailValue>{current.humidity}%</DetailValue>
              </DetailContent>
            </DetailItem>

            <DetailItem>
              <DetailIcon color="#96ceb4">
                <FiCloud />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Cloudy</DetailLabel>
                <DetailValue>86%</DetailValue>
              </DetailContent>
            </DetailItem>

            <DetailItem>
              <DetailIcon color="#feca57">
                <FiWind />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Wind</DetailLabel>
                <DetailValue>{current.wind.speed}km/h</DetailValue>
              </DetailContent>
            </DetailItem>

            <DetailItem>
              <DetailIcon color="#ff9ff3">
                <FiEye />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Visibility</DetailLabel>
                <DetailValue>{current.visibility}km</DetailValue>
              </DetailContent>
            </DetailItem>
          </DetailsGrid>
          </WeatherDetails>
        </motion.div>

        {forecast && (
          <ForecastSection>
            <ForecastHeader>Today's Weather Forecast...</ForecastHeader>
            
            {hourly && hourly.length > 0 && (
              <HourlyForecast>
                {hourly.slice(0, 8).map((hour, index) => (
                  <HourlyItem key={index}>
                    <HourlyTime>{formatTime(hour.time)}</HourlyTime>
                    <HourlyIcon>
                      {getWeatherIcon(hour.weather.main)}
                    </HourlyIcon>
                    <HourlyTemp>{hour.temperature}°</HourlyTemp>
                    <HourlyCondition>{hour.weather.description}</HourlyCondition>
                  </HourlyItem>
                ))}
              </HourlyForecast>
            )}

            {daily && daily.length > 0 && (
              <DailyForecast>
                {daily.slice(0, 5).map((day, index) => (
                  <DailyItem key={index}>
                    <DailyDate>{formatDate(day.date)}</DailyDate>
                    <DailyIcon>
                      {getWeatherIcon(day.weather.main)}
                    </DailyIcon>
                    <DailyCondition>{day.weather.description}</DailyCondition>
                    <DailyTemp>
                      {day.temperature.max}° / {day.temperature.min}°
                    </DailyTemp>
                  </DailyItem>
                ))}
              </DailyForecast>
            )}
          </ForecastSection>
        )}
      </WeatherContainer>
    );
  }

  return (
    <WeatherContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CurrentWeather>
          <MainInfo>
            <Temperature>{current.temperature}°</Temperature>
            <Location>{location.name}</Location>
          </MainInfo>
          <DateTime>
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })} - {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: '2-digit'
            })}
          </DateTime>
          <WeatherIcon>
            {getWeatherIcon(current.weather.main, 'large')}
          </WeatherIcon>
          <WeatherDescription>
            {current.weather.description}
          </WeatherDescription>
          
          {!isInFavorites && (
            <FavoritesButton 
              onClick={handleAddToFavorites}
              disabled={isAddingToFavorites}
            >
              {isAddingToFavorites ? (
                <>
                  <LoadingSpinner />
                  Adding to Favorites...
                </>
              ) : (
                <>
                  <FiHeart />
                  Add to Favorites
                </>
              )}
            </FavoritesButton>
          )}
          
          {isInFavorites && (
            <div style={{ 
              textAlign: 'center', 
              margin: '20px auto',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem'
            }}>
              <FiHeart style={{ marginRight: '8px' }} />
              In Favorites
            </div>
          )}
        </CurrentWeather>
      </motion.div>
    </WeatherContainer>
  );
});

WeatherDisplay.displayName = 'WeatherDisplay';

export default WeatherDisplay;