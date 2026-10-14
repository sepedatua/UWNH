//
//	default strings data
//

#include	"wdefs.h"

	// --- for dummy strings ---
FUCHAR	* NullStrings = "dummy";
FUCHAR	* defaultGameTitleMessage = "Game title name";
FUCHAR	* defaultWelcomeMessage = "Welcome !!" ;
FUCHAR	* defaultByebyeMessage = "Install OK ! Bye !" ;

	// --- for PassWindow ---
FUCHAR	* PassWindowMessage =
"%s will be installed into the\n\
following directory. If you wish to install\n\
the game elsewhere, please type or select a\n\
new drive and directory from below." ;						// [%s] game title

FUCHAR	* PassInputBoxTitle = "Install to:" ;
FUCHAR	* DirectoryWinTitle = "Directory:" ;
FUCHAR	* DriveButtonTitle = "Drive:" ;
FUCHAR	* HD_GameCapaMessage  = "The game requires this much space:" ;
FUCHAR	* HD_AvailableMessage = "Available space on hard drive:    " ;
FUCHAR	* KByteWord = "KB" ;

	// ----------------------
FUCHAR	* NoCapacityMessage = "There is not enough disk space on the drive selected" ;
FUCHAR	* ReadErrorMessage = "Error reading disk" ;
FUCHAR	* NoHardDiskErrorMessage = "";
FUCHAR	* NoDiskDiviceMessage = "";

	// ----------------------
FUCHAR	* InstallStartMessage = "Installation will now begin into the directory\n%s. Is this OK?" ;
FUCHAR	* QuitMessage = "Is it OK to quit installation and return to DOS?" ;
FUCHAR	* InstallFaletMessage = "Installation failed." ;

FUCHAR	* NoInsertDiskMessage = "Error - no disk detected in the drive.\nPlease insert %s and press ENTER." ;	// [%s] disk volume name or Disk
FUCHAR	* DiskWord = "disk" ;
FUCHAR	* DiskketChangeMessage = "Please insert %s and press ENTER." ;				// [%s] disk volume name
FUCHAR	* NoTargetDiskMessage = "Not the designated disk.\nPlease insert %s and press ENTER." ;		// [%s] disk volume name
FUCHAR	* NoMakeDirMessage = "Error - could not create\nthe directory %s." ;										// [%s] make path name
FUCHAR	* FileCopyMessage = "Copying...\nFrom\n %s\nTo\n %s" ;				// [%s] source filename // [%s] target filename

FUCHAR	* OpenErrMessage = "Error - could not open\nthe file %s." ;			// [%s] filename
FUCHAR	* ReadErrMessage = "Error - could not read\nthe file %s." ;			// [%s] filename
FUCHAR	* WriteErrMessage = "Error - could not copy\nthe file %s." ;		// [%s] filename

FUCHAR	* DiffDosVerMessage = " The game will not run with the current DOS version.\n Please use DOS over version %s ." ;		// [%s] DOS version
FUCHAR	* NotEnuoghMemMessage = "There's not enough conventional memory.\nPlease free %s more KBytes." ;
FUCHAR	* NoEXMMessage = "%d Kbytes of EMS memory is required to\nplay %s.\nPlease see the reference card for more details." ;
FUCHAR	* NotEnuoghEXMMessage = "You do not have enough EMS memory to play %s.\nYou need %d more Kbytes.\nPlease see the reference card for more details." ;

FUCHAR	* NoINIfileMessage = "Error - File required for installation is\nmissingÅI Installation will terminate." ;

FUCHAR  * NoHardDiskErrorMessage = "You may not install to drive %c. You may only install to your hard disk.";

FUCHAR  * NoDiskDeviceMessage = "Drive %c does not exist.";
