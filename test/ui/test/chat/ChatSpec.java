package chat;



import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import _palolo.PageObjectModelTest;
import auth.AuthDB;
import chat_panel.ChatPanel;
import people_panel.PeoplePanel;
import utilities.DURATIONS;

public class ChatSpec extends PageObjectModelTest{

	
	static ChatPanel page = null;
	
	
	static PeoplePanel peoplePanel = null;
	
	
	
	@BeforeClass
	public static void init() throws InterruptedException {
		
		AuthDB.setStateTwoStudentsOneTeacher();
	 
		Thread.sleep(DURATIONS.MED.value()); 
		
		WebDriver driver = getDriver();
		
		page = new ChatPanel(driver);

		
		peoplePanel = new PeoplePanel(driver);
		
		loginUser1(driver);
		
		Thread.sleep(DURATIONS.MED.value());
	}
	
	
	
	@AfterClass
	public static void end() throws InterruptedException {
		
		AuthDB.eraseAllUsers();
		page.clearLocalStorage();
		page.close();
	}

	
	
	@Before
	public void waitASec() throws InterruptedException {
		
		
		Thread.sleep(DURATIONS.MED.value());
	}
	
	@Test
	public void testHelloGetsSent() throws InterruptedException {
		
		
		peoplePanel.click2ndPerson();
		
	
		
		Thread.sleep(DURATIONS.MED.value());
		page.getMsgBox().sendKeys("hello");
		Thread.sleep(DURATIONS.HIGH.value());


		
		page.clickSendMsgBtn();
				

		Thread.sleep(DURATIONS.HIGH.value());
		assertEquals("hello",page.getMsgs().get(0).getText());
		
	}
	

	
	@Test
	public void testSendMessagePromptAppearsIfThereIsNoChatHistory() throws InterruptedException {
		
		

		peoplePanel.click2ndPerson();
		
		Thread.sleep(DURATIONS.MED.value());

	
		assertTrue(page.getSendFirstMessagePrompt().isDisplayed());
		
		Thread.sleep(DURATIONS.HIGH.value());
		
		WebElement msgBox = page.getMsgBox();
		
		String placeHolder = msgBox.getAttribute("placeholder");
		
		assertEquals("What would you like to say to User?",placeHolder);
		
		msgBox.sendKeys("Hello.");
		
		
		Thread.sleep(DURATIONS.MED.value());
		
		page.clickSendMsgBtn();
		
		Thread.sleep(DURATIONS.MED.value());
		
		
		assertFalse(page.getSendFirstMessagePrompt().isDisplayed());
	}
}
