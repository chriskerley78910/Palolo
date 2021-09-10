package auth;


import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;

import _palolo.PageObjectModelTest;
import utilities.DURATIONS;

public class LoginPageSpec extends PageObjectModelTest{

	
	static LoginPage page = null;
	
	
	
	@BeforeClass
	public static void init() {
	  page = new LoginPage(PageObjectModelTest.getDriver());
	  
	}
	
	
	
	@AfterClass
	public static void end() throws InterruptedException {
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
	public void testPasswordCautionElementVisibleIfInvalidPassword()  {
		

		WebElement e = page.getPasswordField();
		
		e.clear();
			
		e.sendKeys("invalidPassword");
		
		
		assertTrue(page.getPasswordCautionMark().isDisplayed());
	}
	
	
	@Test
	public void testInvalidPasswordCalloutAppears() {
		
		WebElement e = page.getPasswordField();
		
		e.clear();
		
		e.sendKeys("u2");
		
		assertTrue(page.getLoginPasswordCallout().isDisplayed());
		
		assertEquals("Password is too short.",page.getLoginPasswordErrorMsg().getText());
	}
	

	@Test
	public void testAccountNotActivatedMsg() throws InterruptedException {
		
		  AuthDB.addUnactivatedUser();
		  
		  WebElement emailField = page.getEmailField();
		  
		  emailField.clear();
		 
		  emailField.sendKeys("zxcvbnm88@hotmail.ca");
		  
		  WebElement passwordInput = page.getPasswordField();
		 
		  passwordInput.sendKeys("qweqwe123");
				  
		  passwordInput.sendKeys(Keys.ENTER);
		  		  
		  assertEquals("This account has not been activated yet.",page.getErrorText().getText());
		  	  	  
	}
	
	
	
	@Test
	public void testAccountDoesNotExistMsg() throws InterruptedException {
		
		  AuthDB.eraseAllUsers();
		  
		  WebElement emailField = page.getEmailField();
		  
		  emailField.clear();
		  
		  emailField.sendKeys("zxcvbnm88@hotmail.ca");
		  
		  
		  WebElement passwordInput = page.getPasswordField();
		 
		  passwordInput.sendKeys("qweqwe123");
		
		  passwordInput.sendKeys(Keys.ENTER);
		
		
		  
		  Thread.sleep(4000);
		  
		  assertEquals("No account exists for that user.",page.getErrorText().getText());
		  
	}
	
	
	@Test
	public void testAuthDisappearOnSuccessfulLogin() throws InterruptedException {
		
		
		AuthDB.eraseAllUsers();

		Thread.sleep(DURATIONS.MED.value());
		
		page.getEmailField().clear();
		
		page.getPasswordField().clear();
		
		AuthDB.addActivatedTeacher1();
		
		page.getEmailField().sendKeys("teacher1@eg.com");
		
		page.getPasswordField().sendKeys("qweqwe123");
		
		page.getLoginBtn().click();
		
		Thread.sleep(DURATIONS.MED.value());
		
		assertFalse(page.getAuthPage().isDisplayed());
		
	
	   assertTrue(page.getBanner().isDisplayed());
		
	}
	
	
	
	
	
	
	@Test
	public void testSwitchToSignUpPageUponAccountButtonPress() {
		
		
		WebElement accountButton = page.getCreateAccountButton();
		
		accountButton.click();
		
		assertFalse(page.getLoginPage().isDisplayed());
		
		page.refresh();
		
	}
	
	



	
	
	
	
	


}
