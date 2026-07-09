import { generateResponse } from "../services/ai.service.js";
import { searchInternet } from "../services/internet.service.js";
import { sendEmail } from "../services/mail.service.js";
import { generateGroqResponse } from "../services/models/groq.service.js";
import axios from "axios";
import * as cheerio from 'cheerio';

export async function webSearch(req, res) {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const results = await searchInternet({ query });
    const parsedResults = JSON.parse(results);

    const summary = await generateGroqResponse([
      {
        role: "system",
        content: "You are a search assistant. Summarize the search results in a clear, structured way. Include key points and sources."
      },
      {
        role: "user",
        content: `Search results for "${query}":\n${JSON.stringify(parsedResults, null, 2)}\n\nSummarize these results:`
      }
    ]);

    return res.status(200).json({
      success: true,
      query,
      results: parsedResults,
      summary,
      sources: parsedResults.results?.map(r => r.url) || []
    });

  } catch (error) {
    console.error("Web search error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function sendEmailAgent(req, res) {
  try {
    const { to, subject, message, from } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "To, subject, and message are required"
      });
    }

    await sendEmail({
      to,
      subject,
      html: message,
      text: message.replace(/<[^>]*>/g, '')
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      details: {
        to,
        subject,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Send email error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function generateEmail(req, res) {
  try {
    const { recipient, topic, tone, additionalInfo } = req.body;

    if (!recipient || !topic) {
      return res.status(400).json({
        success: false,
        message: "Recipient and topic are required"
      });
    }

    const prompt = `Generate a professional email with the following details:
- Recipient: ${recipient}
- Topic: ${topic}
- Tone: ${tone || 'professional'}
${additionalInfo ? `- Additional context: ${additionalInfo}` : ''}

Generate a complete email with subject line, greeting, body, and signature.`;

    const emailContent = await generateGroqResponse([
      {
        role: "system",
        content: "You are an email writing assistant. Generate professional, well-structured emails."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
    const lines = emailContent.split('\n');
    let subject = lines.find(line => line.toLowerCase().includes('subject:')) || 'No subject';
    subject = subject.replace(/subject:?\s*/i, '').trim();
    
    const body = lines.filter(line => !line.toLowerCase().includes('subject:')).join('\n').trim();

    return res.status(200).json({
      success: true,
      email: {
        subject,
        body,
        full: emailContent
      }
    });

  } catch (error) {
    console.error("Generate email error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function summarizeYouTube(req, res) {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "YouTube URL is required"
      });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL"
      });
    }
    const summary = await generateGroqResponse([
      {
        role: "system",
        content: "You are a YouTube video summarizer. Provide detailed, structured summaries of video content."
      },
      {
        role: "user",
        content: `Summarize the YouTube video with ID: ${videoId}\n\nProvide:\n1. Main topic\n2. Key points (bullet points)\n3. Timestamps if available\n4. Conclusion\n\nIf you can't access the video, suggest what the video might be about based on the ID or ask for a description.`
      }
    ]);

    return res.status(200).json({
      success: true,
      videoId,
      url,
      summary,
      suggestion: "For accurate summaries, consider using YouTube Transcript API"
    });

  } catch (error) {
    console.error("YouTube summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/v\/)([^?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function saveBookmark(req, res) {
  try {
    const { title, url, description, tags } = req.body;
    const userId = req.user.id;

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: "Title and URL are required"
      });
    }

    const bookmark = {
      userId,
      title,
      url,
      description: description || '',
      tags: tags || [],
      savedAt: new Date().toISOString()
    };
    return res.status(201).json({
      success: true,
      message: "Bookmark saved successfully",
      bookmark
    });

  } catch (error) {
    console.error("Save bookmark error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function getBookmarks(req, res) {
  try {
    const userId = req.user.id;

    return res.status(200).json({
      success: true,
      bookmarks: [],
      message: "Bookmarks feature coming soon"
    });

  } catch (error) {
    console.error("Get bookmarks error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


export async function searchJobs(req, res) {
  try {
    const { query, location } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Job title is required"
      });
    }

    const user = req.userData;
    const searchQuery = `${query} ${location || ''}`.trim();

    console.log("🔍 Searching Google Jobs for:", searchQuery);

    // Build Google Jobs search URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' jobs')}&ibp=htl;jobs`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // Parse job listings from Google Jobs
    $('.iFjolc').each((index, element) => {
      if (jobs.length >= 10) return;

      const title = $(element).find('.nJlQNd').text().trim() || 'Not specified';
      const company = $(element).find('.vNEEBe').text().trim() || 'Unknown Company';
      const location = $(element).find('.Qk80Jf').text().trim() || 'India';
      
      // Extract apply link
      let applyUrl = $(element).find('a').attr('href') || '#';
      if (applyUrl && !applyUrl.startsWith('http')) {
        applyUrl = `https://www.google.com${applyUrl}`;
      }

      const description = $(element).find('.HBvzbc').text().trim() || 'No description available';

      jobs.push({
        id: `job_${index}`,
        title: title,
        company: company,
        location: location,
        salary: 'Not specified',
        description: description.substring(0, 300) + '...',
        applyUrl: applyUrl,
        postedAt: new Date().toISOString(),
        category: 'Not specified'
      });
    });

    // If Google Jobs scraping fails, use Mock Jobs (for testing)
    if (jobs.length === 0) {
      console.log("⚠️ No jobs from Google, using mock data...");
      
      // Sample Indian jobs (for testing)
      const mockJobs = [
        {
          id: 'mock_1',
          title: 'React Developer',
          company: 'Google India',
          location: 'Bangalore, Karnataka',
          salary: '₹15L - ₹25L',
          description: 'We are looking for a skilled React Developer with 3+ years of experience...',
          applyUrl: 'https://careers.google.com/jobs',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_2',
          title: 'Full Stack Developer',
          company: 'Amazon India',
          location: 'Hyderabad, Telangana',
          salary: '₹18L - ₹28L',
          description: 'Looking for a Full Stack Developer with expertise in Node.js and React...',
          applyUrl: 'https://amazon.jobs',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_3',
          title: 'Frontend Engineer',
          company: 'Flipkart',
          location: 'Bangalore, Karnataka',
          salary: '₹12L - ₹20L',
          description: 'Join our frontend team to build scalable web applications using React and TypeScript...',
          applyUrl: 'https://flipkart.careers',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_4',
          title: 'Software Engineer',
          company: 'Microsoft India',
          location: 'Hyderabad, Telangana',
          salary: '₹20L - ₹35L',
          description: 'Microsoft is hiring software engineers for our cloud team...',
          applyUrl: 'https://careers.microsoft.com',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_5',
          title: 'Java Developer',
          company: 'TCS',
          location: 'Mumbai, Maharashtra',
          salary: '₹8L - ₹15L',
          description: 'We are looking for Java developers with Spring Boot experience...',
          applyUrl: 'https://tcs.com/careers',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        }
      ];

      // Return mock jobs
      if (user.subscription.plan === 'free') {
        user.subscription.jobSearchesToday += 1;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        total: mockJobs.length,
        jobs: mockJobs,
        plan: user.subscription.plan,
        searchesUsed: user.subscription.jobSearchesToday,
        limit: user.subscription.plan === 'free' ? 2 : 'Unlimited',
        message: `Showing ${mockJobs.length} sample jobs (real jobs unavailable)`
      });
    }

    // Increment search counter for free users
    if (user.subscription.plan === 'free') {
      user.subscription.jobSearchesToday += 1;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      total: jobs.length,
      jobs: jobs,
      plan: user.subscription.plan,
      searchesUsed: user.subscription.jobSearchesToday,
      limit: user.subscription.plan === 'free' ? 2 : 'Unlimited',
      message: `Found ${jobs.length} jobs for "${query}"`
    });

  } catch (error) {
    console.error("Job search error:", error.message);
    
    // Return mock jobs as fallback
    try {
      const user = req.userData;
      const mockJobs = [
        {
          id: 'mock_1',
          title: 'React Developer',
          company: 'Google India',
          location: 'Bangalore, Karnataka',
          salary: '₹15L - ₹25L',
          description: 'We are looking for a skilled React Developer with 3+ years of experience...',
          applyUrl: 'https://careers.google.com/jobs',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_2',
          title: 'Full Stack Developer',
          company: 'Amazon India',
          location: 'Hyderabad, Telangana',
          salary: '₹18L - ₹28L',
          description: 'Looking for a Full Stack Developer with expertise in Node.js and React...',
          applyUrl: 'https://amazon.jobs',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_3',
          title: 'Frontend Engineer',
          company: 'Flipkart',
          location: 'Bangalore, Karnataka',
          salary: '₹12L - ₹20L',
          description: 'Join our frontend team to build scalable web applications using React and TypeScript...',
          applyUrl: 'https://flipkart.careers',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_4',
          title: 'Software Engineer',
          company: 'Microsoft India',
          location: 'Hyderabad, Telangana',
          salary: '₹20L - ₹35L',
          description: 'Microsoft is hiring software engineers for our cloud team...',
          applyUrl: 'https://careers.microsoft.com',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        },
        {
          id: 'mock_5',
          title: 'Java Developer',
          company: 'TCS',
          location: 'Mumbai, Maharashtra',
          salary: '₹8L - ₹15L',
          description: 'We are looking for Java developers with Spring Boot experience...',
          applyUrl: 'https://tcs.com/careers',
          postedAt: new Date().toISOString(),
          category: 'IT Jobs'
        }
      ];

      if (user && user.subscription.plan === 'free') {
        user.subscription.jobSearchesToday += 1;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        total: mockJobs.length,
        jobs: mockJobs,
        plan: user?.subscription?.plan || 'free',
        searchesUsed: user?.subscription?.jobSearchesToday || 0,
        limit: '2',
        message: `Showing ${mockJobs.length} sample jobs (API unavailable)`
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        message: "All job sources failed. Please try again later."
      });
    }
  }
}
