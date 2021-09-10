package auth;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import _palolo.PageObjectModelTest;

import auth.AuthDB;
import utilities.DURATIONS;

public class SignupPageSpec extends PageObjectModelTest{
	
	static SignupPage page = null;
	
	
	
	
	@BeforeClass
	public static void init() throws InterruptedException {
	
	  AuthDB.addActivatedStudent1();
	  
	  AuthDB.addActivatedStudent2();
	  
	  WebDriver driver = PageObjectModelTest.getDriver();
	  
	  page = new SignupPage(driver);
	
	  
	  
	  Thread.sleep(DURATIONS.MED.value()); 
	  (new LoginPage(driver)).getCreateAccountButton().click();
	  Thread.sleep(DURATIONS.MED.value()); 
	}
	
	
	@AfterClass
	public static void end() {
		AuthDB.eraseAllUsers();
		page.clearLocalStorage();
		page.close();
	}
	
	
	
	@Before
	public void waitASec() throws InterruptedException {
		
		
		AuthDB.eraseAllUsers();
		
		Thread.sleep(DURATIONS.MED.value());
	}
	

	
	@Test
	public void emailFieldExists() throws InterruptedException {
		
		
		assertTrue(page.getEmailField().isDisplayed());
	
	}
	
	@Test 
	public void passwordFieldExists() {
		
		assertTrue(page.getPasswordField().isDisplayed());	
	}
	
	
	@Test 
	public void passwordCalloutMessageWorks() {
		
		page.getPasswordField().sendKeys("short");
		
		assertEquals("Password is too short.",page.getPasswordErrorMsg().getText());
	}
	
	
	
	@Test
	public void showsActivatedEmailSentMessage() throws InterruptedException {
		
		AuthDB.eraseAllUsers();
		
		
		page.clearAll();
		
		Thread.sleep(DURATIONS.HIGH.value());
		
		
		page.getFirstNameField().sendKeys("Chris");
		
		page.getLastNameField().sendKeys("Kerley");
		
	
		
		page.getEmailField().sendKeys("chriskerley78910@gmail.com");
		

	
		page.getPasswordField().sendKeys("qweqwe123");
		
		page.getSignupBtn().click();
		
		Thread.sleep(DURATIONS.MED.value());
		
		assertTrue(page.getSpinner().isDisplayed());
		
		Thread.sleep(DURATIONS.HIGH.value() * 3);
		
		assertTrue(page.getEmailSentMsg().isDisplayed());
		
		
	}
	
	
	@Test
	public void showsUserWithThatAccountExists() {
		
		
		AuthDB.addActivatedTeacher1();
	
		page.getFirstNameField().sendKeys("Chris");
		
		page.getLastNameField().sendKeys("Kerley");
		
		page.getEmailField().sendKeys("teacher1@eg.com");
	
		page.getPasswordField().sendKeys("qweqwe123");
		
		page.getSignupBtn().click();
		
		assertEquals("A user with that email already exists",page.getErrorMsg().getText());
		
	}

	


}
