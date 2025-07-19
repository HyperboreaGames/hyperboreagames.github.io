import { GoogleGenAI } from "@google/genai";

// This script is loaded on all pages. It will only act on the contact page.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form') as HTMLFormElement;
  if (!form) {
    // Not the contact page, do nothing.
    return;
  }

  const statusDiv = document.getElementById('form-status');
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalButtonHTML = submitButton.innerHTML;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitButton.disabled) return;

    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    if (!name || !email || !message || !subject) {
        if(statusDiv) {
            statusDiv.innerHTML = `<p class="text-red-400">Please fill out all fields.</p>`;
        }
        return;
    }

    // Set loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sending...`;
    if(statusDiv) statusDiv.innerHTML = '';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A user named '${name}' has submitted a contact form with the subject '${subject}' and the email '${email}'. Their message is: "${message}". Acknowledge the submission politely.`;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              systemInstruction: "You are a helpful and slightly thematic support agent for a video game company called Hyperborea Games. The theme is futuristic and inspired by Norse mythology. When a user submits a contact form, provide a polite and professional confirmation message acknowledging their submission. Address the user by name. Mention their stated subject. Confirm that if a reply is needed, it will be sent to their email address. Keep the response concise (2-3 sentences). Do not repeat the user's message back to them."
          }
      });
      
      const confirmationMessage = response.text;

      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="flex items-start space-x-3 text-left bg-green-900/30 border border-green-500/30 text-green-300 text-sm rounded-md p-4" role="alert">
            <svg class="h-5 w-5 flex-shrink-0 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <p>${confirmationMessage}</p>
          </div>`;
      }
      form.reset();

    } catch (error) {
      console.error("Gemini API call failed:", error);
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="flex items-start space-x-3 text-left bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-md p-4" role="alert">
             <svg class="h-5 w-5 flex-shrink-0 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p>There was an error sending your message. Please try again later or contact us directly at <a href="mailto:contact@hyperboreagames.dev" class="font-semibold hover:underline">contact@hyperboreagames.dev</a>.</p>
          </div>`;
      }
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHTML;
    }
  });
});
