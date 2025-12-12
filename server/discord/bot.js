const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

class WeatherDiscordBot {
  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || process.env.DISCORD_BOT_ID;
    this.token = process.env.DISCORD_TOKEN;

    if (!this.clientId) {
      throw new Error('DISCORD_CLIENT_ID or DISCORD_BOT_ID not found in environment variables');
    }

    if (!this.token) {
      throw new Error('DISCORD_TOKEN not found in environment variables');
    }

    console.log('Discord Client ID:', this.clientId);
    console.log('Discord Token:', this.token ? '✓ Token loaded' : '✗ Token missing');

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.setupEventHandlers();
    this.setupCommands();
    this.setupScheduledNotifications();
  }

  setupEventHandlers() {
    this.client.once('clientReady', () => {
      console.log(`Discord bot logged in as ${this.client.user.tag}!`);
      this.registerSlashCommands();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const { commandName } = interaction;

      try {
        switch (commandName) {
          case 'weather':
            await this.handleWeatherCommand(interaction);
            break;
          case 'subscribe':
            await this.handleSubscribeCommand(interaction);
            break;
          case 'unsubscribe':
            await this.handleUnsubscribeCommand(interaction);
            break;
          case 'forecast':
            await this.handleForecastCommand(interaction);
            break;
          default:
            await interaction.reply({ content: 'Unknown command!', ephemeral: true });
        }
      } catch (error) {
        console.error('Error handling command:', error);

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing your command.',
            ephemeral: true
          });
        }
      }
    });
  }

  setupCommands() {
    this.commands = [
      new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get current weather for a city')
        .addStringOption(option =>
          option.setName('city')
            .setDescription('City name')
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('Subscribe to daily weather notifications')
        .addStringOption(option =>
          option.setName('city')
            .setDescription('City name for notifications')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('email')
            .setDescription('The email you used to register for the weather app')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('time')
            .setDescription('Notification time (HH:MM format, e.g., 09:00)')
            .setRequired(false)
        ),

      new SlashCommandBuilder()
        .setName('unsubscribe')
        .setDescription('Unsubscribe from weather notifications'),

      new SlashCommandBuilder()
        .setName('forecast')
        .setDescription('Get 5-day weather forecast')
        .addStringOption(option =>
          option.setName('city')
            .setDescription('City name')
            .setRequired(true)
        )
    ];
  }

  async registerSlashCommands() {
    const rest = new REST({ version: '10' }).setToken(this.token);

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(this.clientId),
        { body: this.commands }
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering commands:', error);
      throw error;
    }
  }

  async handleWeatherCommand(interaction) {
    const city = interaction.options.getString('city');

    try {
      const weatherData = await this.getWeatherData(city);
      const embed = this.createWeatherEmbed(weatherData);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Weather command error:', error);
      await interaction.reply({
        content: `Could not find weather data for ${city}. Please check the city name.`,
        ephemeral: true
      });
    }
  }

  async handleSubscribeCommand(interaction) {
    const city = interaction.options.getString('city');
    const email = interaction.options.getString('email');
    const time = interaction.options.getString('time') || '09:00';
    const discordUserId = interaction.user.id;

    try {
      await interaction.deferReply({ ephemeral: true });

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        await interaction.editReply({
          content: 'Invalid time format. Please use HH:MM format (e.g., 09:00, 14:30)'
        });
        return;
      }

      const user = await User.findOne({ email });
      if (!user) {
        await interaction.editReply({
          content: 'User not found. Please make sure you have an account in the weather app with that email.'
        });
        return;
      }

      const weatherData = await this.getWeatherData(city);

      user.discord = {
        userId: discordUserId,
        channelId: interaction.channelId,
        subscribed: true,
        notificationCity: city,
        notificationTime: time,
        lastNotification: null
      };

      await user.save();

      console.log(`✓ User ${user.username} subscribed to ${city} at ${time}`);

      const embed = new EmbedBuilder()
        .setTitle('🌤️ Weather Notifications Subscribed!')
        .setDescription(`You will now receive daily weather updates for **${city}** at **${time}**`)
        .addFields(
          { name: 'Current Weather', value: `${weatherData.temperature}°C - ${weatherData.description}`, inline: true },
          { name: 'Humidity', value: `${weatherData.humidity}%`, inline: true },
          { name: 'Wind Speed', value: `${weatherData.windSpeed} km/h`, inline: true }
        )
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({ text: 'You can change the notification time in Settings' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Subscribe error:', error);

      const errorMessage = error.response?.status === 404
        ? `Could not find weather data for "${city}". Please check the city name.`
        : 'Error subscribing to notifications. Please try again later.';

      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  async handleUnsubscribeCommand(interaction) {
    const discordUserId = interaction.user.id;

    try {
      const user = await User.findOne({ 'discord.userId': discordUserId });
      if (!user || !user.discord?.subscribed) {
        await interaction.reply({
          content: 'You are not subscribed to weather notifications.',
          ephemeral: true
        });
        return;
      }

      user.discord.subscribed = false;
      user.discord.notificationCity = null;
      user.discord.notificationTime = '09:00';
      await user.save();

      await interaction.reply({
        content: '✅ Successfully unsubscribed from weather notifications.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      await interaction.reply({
        content: 'Error unsubscribing from notifications.',
        ephemeral: true
      });
    }
  }

  async handleForecastCommand(interaction) {
    const city = interaction.options.getString('city');

    try {
      const forecastData = await this.getForecastData(city);
      const embed = this.createForecastEmbed(forecastData);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Forecast command error:', error);
      await interaction.reply({
        content: `Could not find forecast data for ${city}. Please check the city name.`,
        ephemeral: true
      });
    }
  }

  async getWeatherData(city) {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city,
        appid: process.env.WEATHER_API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      main: data.weather[0].main
    };
  }

  async getForecastData(city) {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: city,
        appid: process.env.WEATHER_API_KEY,
        units: 'metric'
      }
    });

    return response.data;
  }

  createWeatherEmbed(weatherData) {
    const weatherEmojis = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };

    const emoji = weatherEmojis[weatherData.main] || '🌤️';

    return new EmbedBuilder()
      .setTitle(`${emoji} Weather in ${weatherData.city}, ${weatherData.country}`)
      .setDescription(`**${weatherData.temperature}°C** - ${weatherData.description}`)
      .addFields(
        { name: '🌡️ Feels Like', value: `${weatherData.feelsLike}°C`, inline: true },
        { name: '💧 Humidity', value: `${weatherData.humidity}%`, inline: true },
        { name: '💨 Wind Speed', value: `${weatherData.windSpeed} km/h`, inline: true }
      )
      .setColor(this.getWeatherColor(weatherData.main))
      .setTimestamp()
      .setFooter({ text: 'Weather Bot • Powered by OpenWeatherMap' });
  }

  createForecastEmbed(forecastData) {
    const embed = new EmbedBuilder()
      .setTitle(`🌤️ 5-Day Forecast for ${forecastData.city.name}, ${forecastData.city.country}`)
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({ text: 'Weather Bot • Powered by OpenWeatherMap' });

    const dailyForecast = {};
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();

      if (!dailyForecast[dateKey]) {
        dailyForecast[dateKey] = {
          date: date,
          temps: [],
          weather: item.weather[0]
        };
      }

      dailyForecast[dateKey].temps.push(item.main.temp);
    });

    Object.values(dailyForecast).slice(0, 5).forEach(day => {
      const minTemp = Math.round(Math.min(...day.temps));
      const maxTemp = Math.round(Math.max(...day.temps));
      const dateStr = day.date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      embed.addFields({
        name: dateStr,
        value: `${minTemp}°C - ${maxTemp}°C • ${day.weather.description}`,
        inline: false
      });
    });

    return embed;
  }

  getWeatherColor(weatherMain) {
    const colors = {
      'Clear': 0xFFD700,
      'Clouds': 0x87CEEB,
      'Rain': 0x4682B4,
      'Snow': 0xE6E6FA,
      'Thunderstorm': 0x2F4F4F,
      'Mist': 0xC0C0C0,
      'Fog': 0xC0C0C0
    };
    return colors[weatherMain] || 0x00AE86;
  }

  setupScheduledNotifications() {
    // Check every minute for users who need notifications
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      console.log(`[CRON] Checking notifications at ${currentTime}`);
      await this.checkAndSendNotifications();
    });

    console.log('✓ Dynamic scheduled notifications set up (checking every minute)');
  }

  async checkAndSendNotifications() {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      console.log(`[NOTIFICATION CHECK] Current time: ${currentTime}`);

      // Find ALL subscribed users first to debug
      const allSubscribedUsers = await User.find({
        'discord.subscribed': true,
        'discord.userId': { $exists: true }
      });

      console.log(`[DEBUG] Total subscribed users in DB: ${allSubscribedUsers.length}`);
      
      // Log all users and their notification times
      allSubscribedUsers.forEach(user => {
        console.log(`[DEBUG] User: ${user.username}, Email: ${user.email}, Time: ${user.discord.notificationTime}, City: ${user.discord.notificationCity}`);
      });

      // Find users who should receive notifications at this time
      const subscribedUsers = await User.find({
        'discord.subscribed': true,
        'discord.userId': { $exists: true },
        'discord.notificationTime': currentTime
      });

      console.log(`[NOTIFICATION CHECK] Found ${subscribedUsers.length} users to notify at ${currentTime}`);

      if (subscribedUsers.length === 0) {
        return;
      }

      for (const user of subscribedUsers) {
        try {
          console.log(`[PROCESSING] User: ${user.username}, City: ${user.discord.notificationCity}`);

          // Check if already sent notification today
          const lastNotification = user.discord.lastNotification;
          if (lastNotification) {
            const lastNotifDate = new Date(lastNotification);
            const isSameDay = lastNotifDate.toDateString() === now.toDateString();
            
            if (isSameDay) {
              console.log(`[SKIP] Already sent notification to ${user.username} today at ${lastNotifDate.toLocaleTimeString()}`);
              continue;
            }
          }

          console.log(`[FETCHING] Weather data for ${user.discord.notificationCity}`);
          const weatherData = await this.getWeatherData(user.discord.notificationCity);
          const forecastData = await this.getForecastData(user.discord.notificationCity);
          
          const weatherEmbed = this.createWeatherEmbed(weatherData);
          const forecastEmbed = this.createForecastEmbed(forecastData);

          console.log(`[SENDING] Notification to channel ${user.discord.channelId}`);
          const channel = await this.client.channels.fetch(user.discord.channelId);
          
          await channel.send({
            content: `🌅 **Daily Weather Update for ${user.discord.notificationCity}** (${currentTime})`,
            embeds: [weatherEmbed, forecastEmbed]
          });

          user.discord.lastNotification = now;
          await user.save();

          console.log(`✅ Successfully sent notification to ${user.username} for ${user.discord.notificationCity} at ${currentTime}`);
        } catch (error) {
          console.error(`❌ Error sending notification to ${user.username}:`, error.message);
          console.error(error.stack);
        }
      }
    } catch (error) {
      console.error('❌ Error in notification checker:', error);
      console.error(error.stack);
    }
  }

  async start() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weather-app');
      console.log('✓ Connected to MongoDB');

      await this.client.login(this.token);
      
      console.log('✓ Discord bot started successfully');
      console.log('📍 Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log('🕐 Current server time:', new Date().toLocaleString());
    } catch (error) {
      console.error('✗ Error starting Discord bot:', error);
      process.exit(1);
    }
  }
}

const bot = new WeatherDiscordBot();
bot.start();

module.exports = WeatherDiscordBot;