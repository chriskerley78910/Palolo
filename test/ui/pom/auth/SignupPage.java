package auth;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class SignupPage extends AuthPage{
	
	
	public SignupPage(WebDriver driver) {
		
		super(driver);
	}
	
	
	public WebElement getSignupPage() {
		
		
		return getById("signup-holder");
	}

	
	public WebElement getEmailField() {
			
			
		return getById("signup-email");
	}
	
	
	public WebElement getPasswordField() {
		
		return getById("password-signup");
	}
	
	
	public WebElement getFirstNameField() {
		
		return getById("firstName");
	}
	
	
	public WebElement getLastNameField() {
		
		return getById("lastName");
	}
	
	
	public WebElement getSpinner() {
		
		return getById("signup-spinner");
	}


	public WebElement getSignupBtn() {
	
		return getById("signup-btn");
	}


	public WebElement getEmailSentMsg() {
		
		return getById("activation-email-sent-msg");
	}


	public WebElement getErrorMsg() {
		
		return getById("error_msg");				
		
	}


	public WebElement getBanner() {
		
		return getById("banner_holder");
	}


	public WebElement getPasswordErrorMsg() {
	
		return getById("signup-password-error-msg");
	}


	public void clearAll() {
		
		this.getPasswordField().clear();
		this.getEmailField().clear();
		this.getFirstNameField().clear();
		this.getLastNameField().clear();
		
	}
	
	
	
		
	
}
