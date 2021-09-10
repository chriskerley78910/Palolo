package banner_panel;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import _palolo.PageObjectModel;

public class BannerPage extends PageObjectModel{

	public BannerPage(WebDriver driver) {
		super(driver);
		
	}
	
	
	public WebElement getLogoutButton() {
		
		return this.driver.findElement(By.id("logout-btn"));
	}
	
	
	public WebElement getBannerMenuButton() {
		
		return this.driver.findElement(By.id("banner-menu-btn"));
	}




}
