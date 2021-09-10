package people_panel;


import static org.junit.Assert.assertEquals;

import static org.junit.Assert.assertTrue;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import _palolo.PageObjectModelTest;
import auth.AuthDB;
import utilities.DURATIONS;

public class PeoplePanelSpec extends PageObjectModelTest{

	
	static PeoplePanel page = null;
	
	static int EXPECTED_NUMBER_OF_PEOPLE = 2;
	
	
	@BeforeClass
	public static void init() throws InterruptedException {
		  
	  
	  AuthDB.addActivatedTeacher1();
	  
	  AuthDB.addActivatedStudent1();
	  
	  AuthDB.addActivatedStudent2();
	  
	  try {
		  RelationshipDB.startServer();
		  Thread.sleep(DURATIONS.MED.value());
	  }
	  catch(Exception e) {
		  
		  System.out.println(e);
	  }
	    

	
	  WebDriver driver = PageObjectModelTest.getDriver();
	  
	  loginUser1(driver);
	  
	  
	  page = new PeoplePanel(driver);
	  
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
	public void testRelationshipPanelOpensOnLogin() {
		assertTrue(page.getPeoplePanel().isDisplayed());	
	}
	
	@Test
	public void testAllThreePeopleLoaded() {
		assertEquals(EXPECTED_NUMBER_OF_PEOPLE,page.getPersonRows().size());
	}
	
	@Test
	public void theTopRowIsSelectedByDefault() {
		WebElement bevel = page.getFocusBevel(page.getPersonRows().get(0));
		assertTrue(bevel.isDisplayed());
	}
}
