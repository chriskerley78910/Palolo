package video_chat;



import static org.junit.Assert.assertEquals;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import _palolo.PageObjectModelTest;
import auth.AuthDB;
import utilities.DURATIONS;

public class VideoChatSpec extends PageObjectModelTest{

	static VideoChatPanel page = null;
	
	@BeforeClass
	public static void init() throws InterruptedException {
		
		AuthDB.setStateTwoStudentsOneTeacher();
	 
		Thread.sleep(DURATIONS.MED.value()); 
		
		WebDriver driver = getDriver();
		
		page = new VideoChatPanel(driver);
		
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
			
		Thread.sleep(DURATIONS.HIGH.value() *4);
		String statusText = page.getStatusText();
		assertEquals("is not available.",statusText);
		Thread.sleep(DURATIONS.HIGH.value());		
	}
	
	@Test
	public void testCallingTextIsEmpty() throws InterruptedException {
		
		String callingText = page.getCallingText();
		assertEquals("",callingText);
		Thread.sleep(DURATIONS.MED.value());
	}
	
	@Test
	public void testCallingParallel() {
		
		
	}
	
	
}
