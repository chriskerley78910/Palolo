package video_chat;

import org.openqa.selenium.WebDriver;
import _palolo.PageObjectModel;

public class VideoChatPanel extends PageObjectModel{

	public static final String ONLINE_STATUS_TEXT = "is online.";
	
	public VideoChatPanel(WebDriver driver) {
		super(driver);
	}
	
	public String getStatusText() {
		return this.getById("status-text").getText();
	}
	
	
	public String getCallingText() {
		return this.getById("voice-chat-calling-text").getText();
	}
	
}
