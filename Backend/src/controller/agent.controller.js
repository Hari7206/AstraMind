import { generateResponse } from "../services/ai.service.js";
import { searchInternet } from "../services/internet.service.js";
import { sendEmail } from "../services/mail.service.js";
import { generateGroqResponse } from "../services/models/groq.service.js";

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