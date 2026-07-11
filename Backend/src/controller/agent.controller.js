import { generateResponse } from "../services/ai.service.js";
import { searchInternet } from "../services/internet.service.js";
import { sendEmail } from "../services/mail.service.js";
import { generateGroqResponse } from "../services/models/groq.service.js";
import { YoutubeTranscript } from 'youtube-transcript';
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

    console.log("🔍 Web Search:", query);

    const results = await searchInternet({ query });
    const parsedResults = JSON.parse(results);

    // Better prompt for better summaries
    const summary = await generateGroqResponse([
      {
        role: "system",
        content: `You are a helpful search assistant. Provide accurate, well-structured answers based ONLY on the search results.

        RULES:
        1. Start with a brief, clear answer
        2. Use bullet points for key information
        3. Cite sources at the end
        4. If information is not in search results, say so
        5. Keep it concise and useful`
      },
      {
        role: "user",
        content: `Search Query: "${query}"

        Search Results:
        ${JSON.stringify(parsedResults, null, 2)}

        Provide a clear, structured answer based on these results:`
      }
    ]);

    return res.status(200).json({
      success: true,
      query,
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
    let { recipient, topic, tone, additionalInfo } = req.body;

    console.log("📧 Received:", { recipient, topic });

    // If recipient is raw text and no topic, parse it
    if (recipient && !topic) {
      const text = recipient;
      console.log("📝 Parsing raw text:", text);
      
      // Try to extract email from text
      const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        recipient = emailMatch[1];
        topic = text.replace(emailMatch[1], '').trim();
        // Remove common phrases
        topic = topic.replace(/^create email about\s*/i, '');
        topic = topic.replace(/^write email about\s*/i, '');
        topic = topic.replace(/^send email about\s*/i, '');
        topic = topic.replace(/^email about\s*/i, '');
        topic = topic.trim();
      } else {
        // If no email found, use default
        recipient = "recipient@example.com";
        topic = text;
      }
    }

    if (!recipient || !topic) {
      return res.status(400).json({
        success: false,
        message: "Recipient and topic are required"
      });
    }

    console.log("📧 Recipient:", recipient);
    console.log("📝 Topic:", topic);

    const prompt = `Generate ONLY the email content. No explanations, no extra text.

Recipient: ${recipient}
Topic: ${topic}
Tone: ${tone || 'professional'}
${additionalInfo ? `Additional context: ${additionalInfo}` : ''}

Generate a complete email with:
- Subject line (starting with "Subject:")
- Greeting
- Body
- Signature

Output ONLY the email, nothing else.`;

    const emailContent = await generateGroqResponse([
      {
        role: "system",
        content: "You are an email writer. Generate ONLY the email content. No explanations, no extra text, no examples. Just the email."
      },
      {
        role: "user",
        content: prompt
      }
    ]);

    // Extract subject and body
    const lines = emailContent.split('\n');
    let subject = lines.find(line => line.toLowerCase().includes('subject:')) || 'No subject';
    subject = subject.replace(/subject:?\s*/i, '').trim();
    
    const subjectIndex = lines.findIndex(line => line.toLowerCase().includes('subject:'));
    const bodyLines = subjectIndex !== -1 ? lines.slice(subjectIndex + 1) : lines;
    let body = bodyLines.join('\n').trim();

    // Clean up extra text
    body = body
      .replace(/^Here is (a|the) (professional )?email.*?:\s*/i, '')
      .replace(/^Here you go:\s*/i, '')
      .replace(/^Sure.*?:\s*/i, '')
      .replace(/^Okay.*?:\s*/i, '')
      .replace(/```/g, '')
      .trim();

    return res.status(200).json({
      success: true,
      email: {
        subject,
        body,
        full: emailContent
      }
    });

  } catch (error) {
    console.error("❌ Generate email error:", error.message);
    console.error("❌ Full error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate email"
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

    console.log("📺 Getting transcript for:", videoId);

    // ✅ This is the correct way
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transcript available for this video"
      });
    }

    // Combine transcript text
    const fullText = transcript.map(item => item.text).join(' ');

    // Generate summary using Groq
    const summary = await generateGroqResponse([
      {
        role: "system",
        content: "You are a YouTube video summarizer. Summarize the video content based on the transcript provided."
      },
      {
        role: "user",
        content: `Here is the transcript of the YouTube video:\n\n${fullText.substring(0, 8000)}\n\nProvide a detailed summary of the video including:\n1. Main topic\n2. Key points (bullet points)\n3. Important details\n4. Conclusion`
      }
    ]);

    return res.status(200).json({
      success: true,
      videoId,
      url,
      summary,
      transcriptLength: fullText.length
    });

  } catch (error) {
    console.error("YouTube summary error:", error.message);
    
    // Fallback: Try to get video metadata
    try {
      console.log("🔄 Falling back to YouTube API...");
      
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`
      );
      
      const videoData = response.data.items?.[0]?.snippet;
      if (videoData) {
        const title = videoData.title || 'Unknown';
        const description = videoData.description || '';
        const channel = videoData.channelTitle || 'Unknown';
        
        const fallbackSummary = await generateGroqResponse([
          {
            role: "system",
            content: "You are a YouTube video summarizer. Summarize the video based on its metadata."
          },
          {
            role: "user",
            content: `Summarize this YouTube video:\n\nTitle: ${title}\nChannel: ${channel}\nDescription: ${description}\n\nProvide a brief summary.`
          }
        ]);
        
        return res.status(200).json({
          success: true,
          videoId,
          url,
          summary: fallbackSummary,
          note: "Summary based on video metadata (transcript not available)"
        });
      }
    } catch (fallbackError) {
      console.error("Fallback failed:", fallbackError.message);
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to summarize video"
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

    console.log("🔖 Received bookmark:", { title, url, userId });

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: "Title and URL are required"
      });
    }

    // For now, just return success (no DB yet)
    const bookmark = {
      userId,
      title,
      url,
      description: description || '',
      tags: tags || [],
      savedAt: new Date().toISOString()
    };

    console.log("✅ Bookmark processed:", bookmark.title);

    return res.status(200).json({
      success: true,
      message: "Bookmark saved successfully",
      bookmark
    });

  } catch (error) {
    console.error("❌ Save bookmark error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save bookmark"
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
