package banner_panel;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Set;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import _palolo.PageObjectModelTest;
import auth.AuthDB;
import auth.AuthPage;
import utilities.DURATIONS;

public class MenuSpec extends PageObjectModelTest{
	
	
	
	private static BannerPage page = null;
	
	
	@BeforeClass
	public static void beforeAll() throws InterruptedException {
		
		
		AuthDB.addActivatedTeacher1();
		
		WebDriver driver = PageObjectModelTest.getDriver();
		
		page = new BannerPage(driver);
		
		loginUser1(driver);
		
		Thread.sleep(DURATIONS.LOW.value());
	}
	
	
	@AfterClass
	public static void afterAll() {
		AuthDB.eraseAllUsers();
		page.clearLocalStorage();
		page.close();
	}
	
	
	
	
	@Test
	public void testLogoutButtonNotVisibleInitially() {
		
		WebElement e = page.getLogoutButton();
		assertFalse(e.isDisplayed());
	}
	
	
	
	
	@Test
	public void testLogoutButtonAppearWhenBannerMenuButtonPressed() throws InterruptedException {
		
		WebElement menuBtn = page.getBannerMenuButton();
		
		menuBtn.click();
		
		Thread.sleep(1000);
		
		WebElement logoutBtn = page.getLogoutButton();
		
		assertTrue(logoutBtn.isDisplayed());
		
		menuBtn.click();
		
		assertFalse(logoutBtn.isDisplayed());
	}
	
	

	
	
	
	
	

}
