package chat;

import static org.junit.Assert.*;

import java.util.List;

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

public class Chat2UserSpec extends PageObjectModelTest{
	
	
	private static ChatPanel page1 = null;
	private static ChatPanel page2 = null;
	
	
	@BeforeClass
	public static void init() throws InterruptedException {
		
		AuthDB.eraseAllUsers();
		AuthDB.setStateTwoStudentsOneTeacher();
	 
		Thread.sleep(DURATIONS.MED.value()); 
		
		WebDriver driver1 = getDriver();	
		page1 = new ChatPanel(driver1);
		page1.clearLocalStorage();
		loginUser1(driver1);	
		Thread.sleep(DURATIONS.HIGH.value());
	}
	
	
	@Before
	public void waitASec() throws InterruptedException {
		Thread.sleep(DURATIONS.HIGH.value());
	}
	
	

	
	@Test
	public void test() throws InterruptedException {
		
		
		WebElement msgBox = page1.getMsgBox();
		msgBox.sendKeys("Hello.");		
		page1.clickSendMsgBtn();
		page1.clearLocalStorage();
		page1.close();

		
		
		Thread.sleep(DURATIONS.HIGH.value());
		WebDriver driver3 = getDriver();
		page2 = new ChatPanel(driver3);
		loginUser3(driver3);
		Thread.sleep(DURATIONS.HIGH.value());
		List<WebElement> msgs = page2.getMsgs();
		assertEquals("Hello.",msgs.get(0).getText());
		
	
		page2.clearLocalStorage();
		page2.close();
	
	}

}
