package _palolo;

import java.util.ArrayList;
import java.util.List;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.html5.LocalStorage;
import org.openqa.selenium.html5.WebStorage;
import org.openqa.selenium.remote.Augmenter;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

import auth.LoginPage;
import utilities.DURATIONS;

public class PageObjectModelTest {
	


	protected static WebDriver getDriver() {
		
		  
	  System.setProperty("webdriver.chrome.driver", "/var/www/palolo/test/libs/chromedriver");

	
	  ChromeOptions options = new ChromeOptions(); 
	 
	  options.addArguments("--user-data-dir");
	  options.addArguments("--disable-web-security");
	  options.addArguments("--use-fake-device-for-media-stream");
	  options.addArguments("--use-fake-ui-for-media-stream");
			  

	  WebDriver driver = new ChromeDriver(options);
	  driver.manage().window().maximize();
	  
	  driver.get("http://127.0.0.1");
	  
	  return driver;
	}
	
	

	
	
	/**
	 * Logins a mock user for testing purposes.
	 * @param driver
	 * @throws InterruptedException
	 */
	protected static void loginUser1(WebDriver driver) throws InterruptedException {
		
		login(driver,"teacher1@eg.com","qweqwe123");
		

	}
	
	
	
	
	/**
	 * Logins a mock user for testing purposes.
	 * @param driver
	 * @throws InterruptedException
	 */
	protected static void loginUser3(WebDriver driver) throws InterruptedException {
		
		  login(driver,"student1@eg.com","qweqwe123");
	}
	
	
	
	
	
	private static void login(WebDriver driver, String email, String password) {
		
		LoginPage loginPage = new LoginPage(driver);
		
		try {
			
		  Thread.sleep(DURATIONS.MED.value());
		 
		  loginPage.getEmailField().sendKeys(email);
		  
		  loginPage.getPasswordField().sendKeys(password);
		  
		  loginPage.getLoginBtn().click();
		}
		catch(Exception e) {
			
			loginPage.clearLocalStorage();
			loginPage.close();
			System.out.println("There was a problem setting up the page.");
			System.out.println(e.getMessage());
		}
	}

}
