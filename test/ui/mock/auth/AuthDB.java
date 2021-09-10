package auth;

import _palolo.DB;

public class AuthDB extends DB{
	
	
	private static String phpScriptPath = "php /var/www/auth_server/mock/MockAccountManager.php ";
	

	
	public static void setStateTwoStudentsOneTeacher() {
		
		eraseAllUsers();
		addActivatedTeacher1();
		addActivatedStudent1();
		addActivatedStudent2();
	}
	
	
	
	
	public static void eraseAllUsers() {
		
		
		doCmd("removeAllUsers");
	}
	
	public static void addUnactivatedUser() {
		
	
	    doCmd("addUnactivatedUser");
	}
	
	public static void addActivatedTeacher1() {
		
		
		doCmd("addActivatedTeacher1");
	}
	
	
	public static void addActivatedTeacher2() {
		
		doCmd("addActivatedTeacher2");
	}
	
	
	public static void addActivatedStudent1() {
		
		doCmd("addActivatedStudent1");
	}
	
	
	public static void addActivatedStudent2() {
		
		doCmd("addActivatedStudent2");
	}


	public static void doCmd(String cmd) {
		
		
		executeCmd(phpScriptPath + cmd);
	}

	
}
