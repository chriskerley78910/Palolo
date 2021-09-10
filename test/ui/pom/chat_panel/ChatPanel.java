package chat_panel;



import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import _palolo.PageObjectModel;

public class ChatPanel extends PageObjectModel{


	public ChatPanel(WebDriver driver) {
		
		super(driver);
		
	}


	public WebElement getMsgBox() {
		
		return this.getById("message-input-holder");
	}




	public List<WebElement> getMsgs() {
	
		return this.driver.findElements(By.className("chat-text"));
	}


	public void clickSendMsgBtn() {
		
		this.getById("send-message-btn").click();;
		
	}


	public WebElement getSendFirstMessagePrompt() {
		
		
		return this.getById("send-msg-prompt");
	}
	
}
