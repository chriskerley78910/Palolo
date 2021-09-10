package auth;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;


import _palolo.PageObjectModel;

public class AuthPage extends PageObjectModel {
	

	
	
	public AuthPage(WebDriver driver) {

		super(driver);
	}

	public WebElement getAuthPage() {
		
		return this.driver.findElement(By.id("auth-holder"));
	}
	
	
	
	public WebElement getLoginPage() {
		
		return this.driver.findElement(By.id("login-holder"));
	}
	
	
	
	public WebElement getCreateAccountButton() {
		
		return this.driver.findElement(By.id("create-account-button"));
	}


	
	
	
	
	
}
