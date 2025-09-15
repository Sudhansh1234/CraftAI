# 🎤 Voice Recognition Troubleshooting Guide

## 🚨 **Network Error Fix**

### **Problem**: "Network error. Please check your connection."

The Web Speech API requires an internet connection to work because it uses Google's speech recognition servers.

### ✅ **Solutions**:

1. **Check Internet Connection**
   - Ensure you have a stable internet connection
   - Try refreshing the page
   - Test other websites to confirm connectivity

2. **Browser Settings**
   - **Chrome**: Go to `chrome://settings/content/microphone` and allow microphone access
   - **Edge**: Go to `edge://settings/content/microphone` and allow microphone access
   - **Safari**: Check Safari > Preferences > Websites > Microphone

3. **Firewall/Network Issues**
   - Some corporate networks block Web Speech API
   - Try using a different network (mobile hotspot)
   - Check if your firewall is blocking speech services

4. **HTTPS Requirement**
   - Web Speech API only works on HTTPS sites
   - `localhost` works for development
   - Ensure your production site uses HTTPS

---

## 🔧 **Common Issues & Solutions**

### **1. "Microphone access denied"**
**Solutions:**
- Click the microphone icon in your browser's address bar
- Allow microphone permissions
- Reload the page and try again
- Check system microphone permissions

### **2. "Speech recognition not supported"**
**Solutions:**
- Use Chrome, Edge, or Safari (best support)
- Update your browser to the latest version
- Firefox has limited support - try Chrome instead

### **3. "No speech detected"**
**Solutions:**
- Speak clearly and loudly
- Check microphone volume in system settings
- Test microphone in other apps
- Move closer to your microphone
- Reduce background noise

### **4. Voice recognition stops working**
**Solutions:**
- Refresh the page
- Check internet connection
- Clear browser cache
- Try incognito/private browsing mode

---

## 🌐 **Browser Compatibility**

### ✅ **Fully Supported**
- **Chrome** (Desktop & Mobile) - Best performance
- **Edge** (Desktop & Mobile) - Excellent support
- **Safari** (Desktop & Mobile) - Good support

### ⚠️ **Limited Support**
- **Firefox** - Basic support, may have issues
- **Opera** - Based on Chrome, should work

### ❌ **Not Supported**
- Internet Explorer
- Very old browser versions

---

## 🔍 **Testing Your Setup**

### **Quick Test Steps:**
1. Open your browser's developer console (F12)
2. Go to your CraftAI chat page
3. Click the microphone button
4. Look for any error messages in the console
5. Try speaking clearly for 3-5 seconds

### **What You Should See:**
- ✅ Microphone permission popup
- ✅ "Listening... Speak now..." in the textbox
- ✅ Your words appearing in real-time
- ✅ Message auto-sending when you finish

---

## 🌍 **Language-Specific Issues**

### **English** - Best support in all browsers
### **Hindi/Indian Languages** - Good support in Chrome/Edge
### **Regional Languages** - May have varying accuracy

**Tips for Better Recognition:**
- Speak clearly and at normal pace
- Use common words and phrases
- Avoid very technical terms
- Try English if your language isn't working well

---

## 💡 **Alternative Solutions**

### **If Voice Recognition Doesn't Work:**

1. **Manual Typing**
   - You can always type your messages
   - All AI features work the same way

2. **Different Browser**
   - Try Chrome if using Firefox
   - Use Edge as an alternative
   - Safari works well on Mac/iOS

3. **Mobile Device**
   - Voice recognition often works better on mobile
   - Use your phone's browser
   - Mobile Chrome has excellent voice support

---

## 🛠️ **Developer Console Errors**

### **Common Error Messages & Fixes:**

**"network"** - Internet connection required
- Check internet connection
- Try different network
- Ensure HTTPS (or localhost for development)

**"not-allowed"** - Permission denied
- Allow microphone access
- Check browser permissions
- Reload page and try again

**"no-speech"** - No voice detected
- Speak louder and clearer
- Check microphone settings
- Test microphone in other apps

**"audio-capture"** - Microphone hardware issue
- Check microphone connection
- Try different microphone
- Test in system settings

---

## ✅ **Working Setup Checklist**

- [ ] Internet connection is stable
- [ ] Using Chrome, Edge, or Safari
- [ ] Microphone permissions granted
- [ ] Site is HTTPS (or localhost)
- [ ] No corporate firewall blocking
- [ ] Microphone hardware working
- [ ] Speaking clearly and loudly
- [ ] Background noise minimized

---

## 🆘 **Still Having Issues?**

### **Try These Steps:**
1. **Restart browser completely**
2. **Clear browser cache and cookies**
3. **Try incognito/private mode**
4. **Test on different device**
5. **Use mobile browser**
6. **Check system microphone settings**

### **Fallback Option:**
If voice recognition continues to fail, you can always:
- Type your messages manually
- Use the quick action buttons
- All AI features work identically with typed text

---

## 🎯 **Best Practices for Voice Recognition**

1. **Environment:**
   - Quiet room with minimal background noise
   - Good microphone (built-in or external)
   - Stable internet connection

2. **Speaking:**
   - Clear pronunciation
   - Normal speaking pace
   - Pause between sentences
   - Avoid mumbling or whispering

3. **Technical:**
   - Use latest browser version
   - Grant all necessary permissions
   - Test on multiple devices if available

**🎨 Your voice assistant is designed to work smoothly, but like all speech recognition, it depends on good conditions! 🎤✨**

