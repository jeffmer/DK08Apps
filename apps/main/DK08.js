function KickWd(){
  if(!BTN1.read())E.kickWatchdog();
}
var wdint=setInterval(KickWd,5000); // 5 secs
E.enableWatchdog(20, false); // 20 secs
E.kickWatchdog();
/*
// MIT License (c) 2020 fanoush https://github.com/fanoush
// see full license text at https://choosealicense.com/licenses/mit/
var SPI2 = E.compiledC(`
// int cmd(int,int)
// int cmds(int,int)
// int cmd4(int,int,int,int)
// void setpins(int,int,int,int)
// int enable(int,int)
// void disable()
// void blit_setup(int,int,int,int)
// int blt_pal(int,int,int)

//// int data(int,int)
//// void save()
//// void restore()
//// int fill_color(int,int)

// LCD bpp 16,12 (ST7789) and 8,6 (ST7301 in DK08) supported
#define LCD_BPP 6

// with SHARED_SPIFLASH we need to enable SPI only iniside native code and disable it before return
// to allow espruino to execute from SPI flash on shared SPI pins
//#define SHARED_SPIFLASH

// also we may need to unselect flash chip CS pin as Espruino is in a middle of read command
//#define SPIFLASH_CS (1<<5)

//SPI0 0x40003000
//SPI1 0x40004000
//SPI2 0x40023000
#define SPIBASE 0x40023000

typedef unsigned int uint32_t;
typedef signed int int32_t;
typedef unsigned short uint16_t;
typedef unsigned char uint8_t;
typedef signed char int8_t;
#define NULL ((void*)0)
// if code is in RAM we can put global data into text/code segment
// this allows simpler pc-relative addressing and shorter/faster code
#define __code __attribute__((section(".text")))
//#define __code
// _code volatile uint32_t *SPI =(uint32_t*)SPIBASE;
// direct constant makes smaller/faster code
#define SPI ((volatile uint32_t*)SPIBASE)
//divide register offsets by sizeof(uint32_t)
#define REG(offset) (offset/4)
// SPI master documentation
// https://infocenter.nordicsemi.com/topic/com.nordic.infocenter.nrf52832.ps.v1.1/spi.html?cp=4_2_0_47
// common/nonDMA registers
#define READY REG(0x108)
#define INTENSET REG(0x304)
#define INTENCLR REG(0x308)
#define ENABLE REG(0x500)
#define PSELSCK REG(0x508)
#define PSELMOSI REG(0x50c)
#define PSELMISO REG(0x510)
#define RXD REG(0x518)
#define TXD REG(0x51c)
#define FREQUENCY REG(0x524)
#define CONFIG REG(0x554)
/// EasyDMA registers
#define TASKS_START REG(0x010)
#define TASKS_STOP REG(0x014)
#define EVENTS_STOPPED REG(0x104)
#define EVENTS_ENDRX REG(0x110)
#define EVENTS_END REG(0x118)
#define EVENTS_ENDTX REG(0x120)
#define EVENTS_STARTED REG(0x14C)
#define SHORTS REG(0x200)
#define RXDPTR REG(0x534)
#define RXDMAXCNT REG(0x538)
#define RXDAMOUNT REG(0x53C)
#define RXDLIST REG(0x540)
#define TXDPTR REG(0x544)
#define TXDMAXCNT REG(0x548)
#define TXDAMOUNT REG(0x54C)
#define TXDLIST REG(0x550)
#define ORC  REG(0x5c0)
#define GPIO(x) ((volatile uint32_t*)(0x50000000+x))
#define OUT     GPIO(0x504)
#define OUTSET  GPIO(0x508)
#define OUTCLR  GPIO(0x50c)
#define IN     GPIO(0x510)
// direction 1=output
#define DIR     GPIO(0x514)
#define DIRSET     GPIO(0x518)
#define DIRCLR     GPIO(0x51c)

__code uint32_t pSCK= -1;
__code uint32_t pMOSI= -1;
__code uint32_t pMISO= -1;
__code uint32_t pCS= 0;
__code uint32_t pCD= 0; //command/data
void setpins(int sck,int mosi,int cs,int cd){
  pSCK=sck;pMOSI=mosi;pCS=1<<cs;pCD=1<<cd;
}
__code uint32_t savedintflags=0;
__code uint32_t savedmode=0;

void save(){
  savedintflags=SPI[INTENSET];
  savedmode=SPI[ENABLE];
}

void restore(){
  SPI[ENABLE]=0;
  SPI[INTENSET]=savedintflags;
  SPI[ENABLE]=savedmode;
}

// pins need to be already preconfigured as gpio input/outputs
int setup(uint32_t speed,uint32_t mode){
  if (pSCK>=0 && (pMISO>=0||pMOSI>=0)){
    uint32_t flags=SPI[INTENSET];
    if (flags) SPI[INTENCLR]=flags; // clear all interrupt flags
    SPI[PSELSCK]=pSCK;
    SPI[PSELMOSI]=pMOSI;
    SPI[PSELMISO]=pMISO;
    SPI[FREQUENCY]=speed<<24; // 0x80=8mbits,0x40=4mbits,...
    SPI[CONFIG]=mode<<1; //msb first
    return 1;
  }
  return 0;
}
void disable(){
  SPI[ENABLE]=0;
  SPI[READY]=0;
  uint32_t flags=SPI[INTENSET];
  if (flags) SPI[INTENCLR]=flags; // clear all interrupt flags
}


int enable(uint32_t speed,uint32_t mode){
  if (SPI[ENABLE]) return -1;
  if (setup(speed,mode)){
#ifndef SHARED_SPIFLASH
    SPI[ENABLE]=7;//SPIM with DMA
    SPI[TASKS_STOP]=1;
    //isDMA=1;
#endif
    return 1;
  }
  return 0;
}
int write_dma(uint8_t *buffer, uint32_t len,int async);

int data(uint8_t *buffer, int len){
  if (pCD==0) return -1;
  if(buffer==NULL || len==0) return -1;
#ifdef SHARED_SPIFLASH
#ifdef SPIFLASH_CS
  *OUTSET = SPIFLASH_CS;
#endif
    SPI[ENABLE]=7;//SPIM with DMA
#endif
  if(pCS>0) *OUTCLR = pCS; // CHIP SELECT
  *OUTSET = pCD; // data
  write_dma(buffer,len,0);
  if(pCS>0) *OUTSET = pCS; // CHIP SELECT
#ifdef SHARED_SPIFLASH
    SPI[ENABLE]=0;//disable SPI
#endif
  return 0;
}
int cmd(uint8_t *buffer, int len){
  if (pCD==0) return -1;
#ifdef SHARED_SPIFLASH
#ifdef SPIFLASH_CS
  *OUTSET = SPIFLASH_CS;
#endif
    SPI[ENABLE]=7;//SPIM with DMA
#endif
  *OUTCLR = pCD; // CMD
  if(pCS>0) *OUTCLR = pCS; // CHIP SELECT
  write_dma(buffer,1,0);
  *OUTSET = pCD; // data
  if (len>1)
    write_dma(buffer+1,len-1,0);
  if(pCS>0) *OUTSET = pCS; // CHIP SELECT
#ifdef SHARED_SPIFLASH
    SPI[ENABLE]=0;//disable SPI
#endif
  return 0;
}
int cmds(uint8_t *ptr,int bufflen){
  int cnt=0;
  if (!ptr) return cnt;
  uint8_t *endptr=ptr+bufflen;
  uint8_t len;
  while ((len=*ptr++)!=0){
    if ((ptr+len)>endptr) return -cnt;// break if we would go past buffer
    if(cmd(ptr,len)) break;
    ptr+=len;cnt++;
  }
  return cnt;
}
// send command with up to 3 parameters (espruino allows methods with up to 4 parameters)
int cmd4(int c0,int d1,int d2, int d3){
  int cnt=0;
  uint8_t buff[4];
  if (c0>=0)buff[cnt++]=c0; else return 0;
  if (d1>=0)buff[cnt++]=d1;
  if (d2>=0)buff[cnt++]=d2;
  if (d3>=0)buff[cnt++]=d3;
  cmd(buff,cnt);
  return cnt;
}
__code uint16_t running=0;
void wait_dma(){
  if (running) {
    while (SPI[EVENTS_END] == 0); // wait for previous transfer
    SPI[EVENTS_END]=0;
    running=0;
  }
}
int write_dma(uint8_t *ptr, uint32_t len, int async)
{
  wait_dma();
  int offset = 0;
  SPI[RXDPTR]=0;
  SPI[RXDMAXCNT]=0;
  SPI[EVENTS_END]=0;
  do {
    SPI[TXDPTR]=(uint32_t)(ptr + offset);
    if (len < 0x100) {
      SPI[TXDMAXCNT]=len;
      len = 0;
    } else {
      SPI[TXDMAXCNT]=0xff;
      offset = offset + 0xff;
      len = len - 0xff;
    }
    SPI[TASKS_START]=1;
    if (async && len==0){
      running=1; // do not wait for last part
    } else {
        while (SPI[EVENTS_END] == 0);
        SPI[EVENTS_END]=0;
    }
  } while (len != 0);
  return 0;
}
__code uint16_t blit_bpp=0;
__code uint16_t blit_w=0;
__code uint16_t blit_h=0;
__code uint16_t blit_stride=0;
void blit_setup(uint16_t w,uint16_t h,uint16_t bpp, uint16_t stride){
  blit_bpp=bpp;blit_w=w;blit_h=h;blit_stride=stride; //*bpp/8;
}
#define LCHUNK 36 // divisible by 3 and 2

#if LCD_BPP<=8
//only 8 bit palette entry
typedef uint8_t palbuff_t;
#else
typedef uint16_t palbuff_t;
#endif
int blt_pal(uint8_t *buff,palbuff_t* palbuff,uint8_t xbitoff){
  uint8_t *pxbuff=buff;
  uint8_t bpp=blit_bpp;
  if (pxbuff==NULL || palbuff==NULL || bpp==0 || bpp>8) return -1;
  uint8_t mask=(1<<bpp)-1; //pixel bitmask
  uint8_t bpos=xbitoff;
  uint16_t val=(*pxbuff++)|((*pxbuff++)<<8);val>>=bpos; // we prefetch 8-16 bits
  uint16_t w=blit_w;
  uint16_t h=blit_h;
  uint8_t lbuff_1[LCHUNK];
  uint8_t lbuff_2[LCHUNK];
  uint8_t *lbuff=lbuff_1;
  int lbufpos=0;
  int lbuffnum=0;
#ifdef SHARED_SPIFLASH
#ifdef SPIFLASH_CS
  *OUTSET = SPIFLASH_CS;
#endif
  SPI[ENABLE]=7;//SPIM with DMA
#endif
  if(pCS>0) *OUTCLR = pCS; // CHIP SELECT
  do {
    w=blit_w;
    do {
#if LCD_BPP==12
      // pixel 1
      uint16_t px1=palbuff[val&mask]; // get color
      val=val>>bpp;bpos+=bpp;
      //pixel 2
      uint16_t px2=palbuff[val&mask]; // get color
      val=val>>bpp;bpos+=bpp;
      if(bpos>=8){bpos-=8;val=val|(*pxbuff++)<<(8-bpos);} //less than 8 bits, prefetch another byte
      //put 2x 12bit pixels into buffer
      lbuff[lbufpos++]=px1>>4;
      lbuff[lbufpos++]=(px1<<4)|(px2>>8);
      lbuff[lbufpos++]=px2&255;
      w-=2;
#elif LCD_BPP==16
      // pixel 1
      uint16_t px1=palbuff[val&mask]; // get color
      val=val>>bpp;bpos+=bpp;
      if(bpos>=8){bpos-=8;val=val|(*pxbuff++)<<(8-bpos);} //less than 8 bits, prefetch another byte
      //put 16bit pixel into buffer
      lbuff[lbufpos++]=px1>>8;
      lbuff[lbufpos++]=px1&255;
      w--;
#elif LCD_BPP==8
      // pixel 1
      // get color from palette or as direct value if no palette
      uint8_t px1= (palbuff) ? palbuff[val&mask] : val&mask;
      val=val>>bpp;bpos+=bpp;
      if(bpos>=8){bpos-=8;val=val|(*pxbuff++)<<(8-bpos);} //less than 8 bits available, prefetch another byte
      //put 8bit pixel into buffer
      lbuff[lbufpos++]= px1<<2 ; //(bpp==6) ? px1<<2 : px1 ; // 6bit to 8bit
      w--;
#elif LCD_BPP==6
      // send 4 packed 6bit pixels in 3 bytes
      uint8_t px[4];
      for (int i=0;i<4;i++){
        px[i] = (palbuff) ? palbuff[val&mask] : val&mask;
        val=val>>bpp;bpos+=bpp;
        if(bpos>=8){bpos-=8;val=val|(*pxbuff++)<<(8-bpos);} //less than 8 bits available, prefetch another byte
      }
      //pack into 3 bytes
      lbuff[lbufpos++]= px[0]<<2 | px[1]>>4;
      lbuff[lbufpos++]= px[1]<<4 | px[2]>>2;
      lbuff[lbufpos++]= px[2]<<6 | px[3];
      w-=4;
#endif
      if (lbufpos >= LCHUNK){
        // buffer full, start async draw and switch to other buffer
        write_dma(lbuff,lbufpos,1);
        lbuffnum=1-lbuffnum;
        lbuff = lbuffnum ? lbuff_2 : lbuff_1;
        lbufpos=0;
      }
    } while(w>0);
    buff+=blit_stride;
    pxbuff=buff;bpos=xbitoff;
    val=(*pxbuff++)|(*pxbuff++)<<8;val>>=bpos;//val=(*pxbuff++)>>bpos;
    h--;
  } while(h>0);
  // send the rest
  if (lbufpos>0){
    write_dma(lbuff,lbufpos,0);
  } else {
    wait_dma();
  }
  if(pCS>0) *OUTSET = pCS; // CHIP SELECT
#ifdef SHARED_SPIFLASH
  SPI[ENABLE]=0;//disable SPI
#endif
  return 0;
}
#if 0
// write same buffer many times repeatedly
int write_many_dma(uint8_t *buffer, int len, int count){
  wait_dma();
  SPI[RXDPTR]=0;
  SPI[RXDMAXCNT]=0;
  SPI[EVENTS_END]=0;
  SPI[TXDPTR]=(uint32_t)(buffer);
  SPI[TXDMAXCNT]=len;
  if (count > 1)
    SPI[SHORTS]=1<<17;
  SPI[TASKS_START]=1;
  do {
    while (SPI[EVENTS_END] == 0); // wait
    SPI[EVENTS_END]=0;
    if (count <= 2) SPI[SHORTS]=0; // stop shortcut for next loop
  } while (--count);
return 0;
}
#if LCD_BPP==12
int fill_color(uint32_t val,uint32_t len){
  uint8_t buff[12]={ // 92ms for 24, 97ms for 12
//    val>>4,(val&0xf)<<4|val>>8,val&0xff,
//    val>>4,(val&0xf)<<4|val>>8,val&0xff,
//    val>>4,(val&0xf)<<4|val>>8,val&0xff,
//    val>>4,(val&0xf)<<4|val>>8,val&0xff,
    val>>4,(val&0xf)<<4|val>>8,val&0xff,
    val>>4,(val&0xf)<<4|val>>8,val&0xff,
    val>>4,(val&0xf)<<4|val>>8,val&0xff,
    val>>4,(val&0xf)<<4|val>>8,val&0xff
  };
  return write_many_dma(buff,12,len/8);
}
#elif LCD_BPP==16
int fill_color(uint32_t val,uint32_t  len){
  uint8_t buff[16]= { // 126ms for 16, 121ms for 32 bytes
//    val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff,
//    val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff,
    val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff,
    val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff, val>>8,val&0xff
  };
  return write_many_dma(buff,16,len/8);
}
#elif LCD_BPP==8
int fill_color(uint32_t val,uint32_t len){
  uint8_t v=val&0xff;
  uint8_t buff[16]= { // 126ms for 16, 121ms for 32 bytes
    v, v, v, v,
    v, v, v, v,
    v, v, v, v,
    v, v, v, v
  };
  return write_many_dma(buff,16,len/16);
}
#endif
#endif
`);
*/

///*
var SPI2 = (function(){
  var bin=atob("AAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////8QtQNMfEQigGCAoYDjgBC92P///wdLe0QbiUOxBEoTaAAr/NAAIxNgA0p6RBOBcEcYMQJAxv///7L///8t6fBHkEYZTBlO//fl/xlK3/hkwAAjASUTYE/w/w5TYKlGI2AQMh9G/ykA6wMKwvgAoIu//zMxYMb4AOAAIYi//znM+ACQuPEADwbQKbkLS3tEHYEAIL3o8IfU+ACguvEAD/rQJ2AAKd7R8+cYMQJASDUCQDQ1AkAQMAJAUP///y3p8E+TRldKnbB6RAKRkvgAoAZGACgA8J6AACkA8JuACvH/MwcrAPKWgAEjA/oK8wE727IDk4McAJMEeEN4svgEgETqAyTTaET6C/SksguxQkoTYERLe0QEkwqrBpNDS0/wAAl7RElGE6gHkwSbW4gBkwmrXUYFkwAiA5sCnyNAVUT7XAWf7bIHLdNVRPoK9FHYpLIBMgQq79Gd+CXAnfgkIE/qLBND6oIDnfgmIENUQxgfRpMQQ+oME3twnfgnMEPqghIBmwHxAg4EOwMxm7IjKQD4DiABkwndASL/91D/2fEBCRO/BphJRhOoACEBmwArwdEHm9uIHkSzHACTNHhzeAjx/zhE6gMkRPoL9B/6iPiksrjxAA+o0cmxQkb/9y//E0t7RNhoELENSxhgACAdsL3o8I8Anwg9F/gBOwCX7bLF8QgMA/oM8xxDpLKh5//3Av/l50/w/zDp5wwFAFAIBQBQFv///8r+//+8/v///P3//xVKekRwtQ5GEWkFRuGxEEsZYNJoArEaYAAiASEoRv/39f4OSwtMe0QBLhppImAE3QAicR5oHP/36f4JS3tE2GgIsSBgACBwvU/w/zD75wC/DAUAUAgFAFCq/f//hv3//3D9//8TtQAoHtsAKaa/jfgFEAIkASQAKqS/AqkJGY34BACkvwE0AfgELAAror8CqhIZATQhRgGoqL8C+AQ8//ev/yBGArAQvQAk+udwtQVGiLFGGAAkKEYQ+AEbGbFFGLVCAtlkQiBGcL3/95n/ACj50QE07+cERvXnAAAPSjC1FGjEuQ5LG2gLsQ5MI2ARSw1Me0QABl1pJWCdaWVg3GkKS0kAHGBYYVlkByMTYAhLASAYYDC9T/D/MPvnADUCQAQzAkAIMwJACDUCQBA1AkAUMAJAuvz//wVKACMTYKL1fnITYANLG2gLscL4ADJwRwA1AkAEMwJAELUGTHxExOkFAQEhAfoC8gH6A/PiYCNhEL0Av1D8//8=");
  return {
    cmd:E.nativeCall(593, "int(int,int)", bin),
    cmds:E.nativeCall(765, "int(int,int)", bin),
    cmd4:E.nativeCall(693, "int(int,int,int,int)", bin),
    setpins:E.nativeCall(937, "void(int,int,int,int)", bin),
    enable:E.nativeCall(813, "int(int,int)", bin),
    disable:E.nativeCall(905, "void()", bin),
    blit_setup:E.nativeCall(33, "void(int,int,int,int)", bin),
    blt_pal:E.nativeCall(221, "int(int,int,int)", bin),
  };
})();

// this produces code string that can replace bin declaration with heatshrink compressed variant of bin to
// save source code size however it looks like it does not save much
//    shrink:function(){return `var bin=E.toString(require("heatshrink").decompress(atob("${btoa(require("heatshrink").compress(bin))}")))`;}
//*/

//DK08 LCD pins
CS=D18;DC=D19;RST=D15;BL=D13;
CLK=D17;MOSI=D16;PWR=D11;
//fontchip SPI pins
FCS=D27;//FMOSI=D30;FMISO=D31;FCLK=D29;
var fc=new SPI();fc.setup({sck:D29,miso:D31,mosi:D30,mode:0});
//fc.send([0xab],FCS);//wake fontchip from deep sleep
//fc.send([0x90,0,0,1,0,0],FCS) // get flash id
//fc.send([0x9f,0,0,0],FCS); //get flash id
fc.send([0xb9],FCS); // put to deeep sleep
//HR sensor over i2c
//HPWR=D14;HSCL=D22;HSDA=D20;
var hr=new I2C();hr.setup({scl:D20,sda:D22});
function hrRead(reg,len){hr.writeTo(0x24,reg);return hr.readFrom(0x24,len);}
function hrWrite(reg,data){hr.writeTo(0x24,reg,data);}

//BMA253 SPI accelerometer
//AI1=D4;AI2=D3;ACS=D2;AMOSI=D30;AMISO=D31;ACLK=D22;APWR=D7;
//
function LCD_Init_Off(){
  // LCD pins init + reset/turn off
  BL.reset();
  RST.reset();
  CLK.write(0);MOSI.write(0);CS.write(0);DC.write(0);
  PWR.set();
}
function LCD_Init(){
  // pins init reset done + power up
  CS.set();CLK.set();MOSI.set();DC.set();
  RST.set();
  PWR.reset();
}
E.kickWatchdog();
LCD_Init_Off();
//SPI2.save();
SPI2.setpins(CLK,MOSI,CS,DC);
//SPI2.disable();
function toFlatString(arr){
  var b=E.toFlatString(arr);if (b) return b;
  print("toFlatString() fail&retry!");E.defrag();b=E.toFlatString(arr);if (b) return b;
  print("fail&retry again!");E.defrag();b=E.toFlatString(arr);if (b) return b;
  print("failed!"); return b;
}

function lcd_cmd(a){
  var l=a.length;
  if (!l)return SPI2.cmd4(a,-1,-1,-1);
  if (l==2)return SPI2.cmd4(a[0],a[1],-1,-1);
  if (l==3)return SPI2.cmd4(a[0],a[1],a[2],-1);
  if (l==4)return SPI2.cmd4(a[0],a[1],a[2],a[3]);
  if (l==1)return SPI2.cmd4(a[0],-1,-1,-1);
  var b=toFlatString(a);
  SPI2.cmd(E.getAddressOf(b,true),b.length);
}

function lcd_cmds(arr){
  var b=toFlatString(arr);
  var c=SPI2.cmds(E.getAddressOf(b,true),b.length);
  if (c<0)print('lcd_cmds: buffer mismatch, cnt='+c);
  return c;
}


function ST7301_INIT(){
return lcd_cmds(
  //new Uint8Array(
  [
    2, 0xeb, 0x2,//
    2, 0xd7, 0x68,//
    2, 0xd1, 0x1, //
    3, 0xe8, 0x55, 0x06,//
    2, 0xc0, 0xe5,//
    3, 0xb2, 0x0, 0, //1,0x2,// refresh rates in hp (25,50Hz) lp (1/4,1/2,1,2,4,8Hz) modes
    11, 0xb4, 0xc5,0x77,0xf1,0xff,0xff,0x4f,0xf1,0xff,0xff,0x4f,
    2, 0xb7, 0,
    2, 0xb0, 0x59,
    1, 0x11, // sleep out
0]
//)
  );
}
function ST7301_INIT_NEXT(){
return lcd_cmds(
  //new Uint8Array(
  [
    3, 0xc7, 0x80, 0xe9,// framerate 25/50Hz
    2, 0xd6, 0x1,//
    2, 0xcb, 0x15,//
    2, 0x36, 0x48,//
    2, 0x3a, 0x11,// 10= 4px=4bytes (LCD_BPP=8), 11 4px=3bytes (LCD_BPP=6)
    5, 0x72, 0x20, 0x4, 0x80, 0xfa,// de-stress

    3, 0xb5, 2, 0,
    2, 0xb9, 0x23,
    2, 0xb8, 0x8,

//    3, 0x2a, 8, 0x33,
//    3, 0x2b, 0, 0xaf,
//    2, 0x35, 0,// TE on
    1, 0x34, // TE off 
    2, 0xd0, 0x1f,//
    1, 0x38,
    2, 0xd8, 0x1,//
    2, 0xc4, 0xb1,//
    2, 0xd8, 0x3,//
    2, 0xe3, 0x2,//
    //1, 0x3c,
  //
0]
//)
  );
}

function delayms(ms){
  digitalPulse(DC,0,ms);digitalPulse(DC,0,0);
}

var mode;
function LCD_FastMode(on){
 if (mode===on) return;
 if (on){
   lcd_cmd(0x38); // high power mode
   delayms(125);
   lcd_cmd([0xcb,0x15]); // VCOMH voltage to 4.05V
   lcd_cmd([0xd6,0x1]); // change voltage source to vsh/vsl 1
   delayms(40);
 } else {
   //return; //disable for now
   lcd_cmd([0xcb,0x1f]); //raise VCOMH voltage to 4.55V for high power mode, why when we are switching to low power mode?)
   lcd_cmd([0xd6,0x3]); // change voltage source to vsh/vsl 3
   delayms(40);
   lcd_cmd(0x39); // low power mode on
 }
 mode=on;
}
/* not needed
var lcd_on=0;
function LCD_Off(){
  if (lcd_on){
   lcd_cmd([0x38);
    // delay 0xfa - 250ms
  }
   lcd_cmd([0xd6,0xd0]);
   lcd_cmd([0xbd,1]);
   lcd_cmd([0x75,1]);
   lcd_cmd(0x28);
   lcd_cmd(0x10);
  //delay 100ms
  lcd_on=0;
}
function LCD_SleepIn(){
   lcd_cmd(0x29);
   lcd_cmd(0x10);
}

function LCD_AllDown(){
   lcd_cmd(0x28);
  LCD_Init_Off();
}
*/

E.kickWatchdog();
LCD_Init();
SPI2.enable(0x80,0); //8MBit, mode 0
//digitalPulse(RST,0,10);
//delayms(10);
// http://forum.espruino.com/conversations/316409/
// size of <23 bytes Uint8Array does not create flat string
// we need flat arrays to pass to native InlineC code
function toFlatBuffer(a){return E.toArrayBuffer(toFlatString(a));}

var bpp=4;
var g=Graphics.createArrayBuffer(176,176,bpp);
var pal;
switch(bpp){
  case 2: pal= new Uint8Array(toFlatBuffer([0x00,0xc0,0x30,0x0c]));break; // white won't fit
//  case 1: pal= new Uint8Array([0x00,0xff]);break;
  case 1:
    // same as 16color below, use for dynamic colors
  pal= new Uint8Array(toFlatBuffer(
    [0,0x2,0x8,0xa,0x20,0x22,0x24,0x2a,0x15,0x17,0x1d,0x1f,0x3d,0x37,0x3d,0x3f]
 ));
  g.sc=g.setColor;
  c1=pal[1]; //save color 1
  g.setColor=function(c){ //change color 1 dynamically
    c=Math.floor(c);
    if (c > 1) {
      pal[1]=pal[c]; g.sc(1);
    } else if (c==1) {
      pal[1]=c1; g.sc(1);
    } else g.sc(c);
  }; break;
  case 4: pal=
    // CGA
    new Uint8Array(toFlatBuffer([
    // function RGB444to222(r,g,b){return(((r>>2)<<6)|((g>>2)<<4)|((b>>2)<<2)).toString(16);}
//  CGA palette 6bit RGB222
    0,0x2,0x8,0xa,0x20,0x22,0x24,0x2a,0x15,0x17,0x1d,0x1f,0x3d,0x37,0x3d,0x3f
//  CGA palette 12bit RGB444
//      0x000,0x00a,0x0a0,0x0aa,0xa00,0xa0a,0xa50,0xaaa,
//     0x555,0x55f,0x5f5,0x5ff,0xf55,0xf5f,0xff5,0xfff
//16bit RGB565
//      0x0000,0x00a8,0x0540,0x0555,0xa800,0xa815,0xaaa0,0xad55,
//      0x52aa,0x52bf,0x57ea,0x57ff,0xfaaa,0xfabf,0xffea,0xffff

    ]));break;
    case 6:
    pal = new Uint8Array(64);
    for(var i=0;i<64;i++) pal[i]=i<<2;
}
// preallocate setwindow command buffer for flip
g.winCmd=toFlatBuffer([
  3, 0x2a, 0, 0,
  3, 0x2b, 0, 0,
  1, 0x2c,
  0 ]);
// precompute addresses for flip
g.winA=E.getAddressOf(g.winCmd,true);
g.palA=E.getAddressOf(pal.buffer,true); // pallete address
g.buffA=E.getAddressOf(g.buffer,true); // framebuffer address
g.stride=g.getWidth()*bpp/8;
g.flip=function(){
  var r=g.getModified(true);
  //print(r);
  if (r === undefined) return;
  var x1=r.x1&0xfc;var x2=(r.x2+4)&0xfc; //align to 4 pixels 
  var xw=(x2-x1);
  var yw=(r.y2-r.y1+1);
  if (xw<1||yw<1) {print("empty rect ",xw,yw);return;}
  var c=g.winCmd;
  c[2]=8+(x1>>2);c[3]=8+(x2>>2)-1; //0x2a params
  c[6]=r.y1;c[7]=r.y2; // 0x2b params
  /*lcd_cmds([
  3, 0x2a, 8+(x1>>2), 8+(x2>>2)-1,
  3, 0x2b, r.y1, r.y2,
  1, 0x2c,
  0 ]);*/
  SPI2.blit_setup(xw,yw,bpp,g.stride);
  var xbits=x1*bpp;
  var bitoff=xbits%8;
  var addr=g.buffA+(xbits-bitoff)/8+r.y1*g.stride; // address of upper left corner
  //VIB.set();//debug
  SPI2.cmds(g.winA,c.length);
  SPI2.blt_pal(addr,g.palA,bitoff);
  //VIB.reset();//debug
};

g.bl=function(bl){
  if (bl>=1) BL.set();
  else if (bl<=0) BL.reset();
  else analogWrite(BL,bl);
};

var VIB=D6;
function vibon(vib){
  if(vib.i>=1)VIB.set();else analogWrite(VIB,vib.i);
  setTimeout(viboff,vib.on,vib);
}
function viboff(vib){
  VIB.reset();
  if (vib.c>1){vib.c--;setTimeout(vibon,vib.off,vib);}
}

vibrate=function(intensity,count,onms,offms){
  vibon({i:intensity,c:count,on:onms,off:offms});
};
var CHPOW=D24; // power attached
var CHDONE=D23; //charging done
CHDONE.mode("input_pullup");

function battState(){
if (!CHPOW.read()) return 0;
return CHDONE.read()?2:1;
}
function battVolts(){
  return 4.20/0.29*analogRead(D5);
}
function battLevel(v){
  var l=3.5,h=4.19;
  v=v?v:battVolts();
  if(v>=h)return 100;
  if(v<=l)return 0;
  return 100*(v-l)/(h-l);
}
function battInfo(v){v=v?v:battVolts();return `${battLevel(v)|0}% ${v.toFixed(2)}V`;}

function randomLines(){
  LCD_FastMode(true);
  g.clear();
  var cols=(bpp==1)?14:(1<<bpp)-1,w=g.getWidth(),h=g.getHeight(),r=Math.random;
  return setInterval(function(){
    g.setColor(1+r()*cols);
    g.drawLine(r()*w,r()*h,r()*w,r()*h);
      g.flip();
  },30);
}

function randomShapes(){
  LCD_FastMode(true);
  g.clear();
  var cols=(bpp==1)?14:(1<<bpp)-1,w=g.getWidth()-10,h=g.getHeight()-10,r=Math.random;
  return setInterval(function(){
    g.setBgColor(0);
    g.setColor(1+r()*cols);
    var x1=r()*w;x2=10+r()*w;
    var y1=r()*h;y2=10+r()*h;
    if (bpp==1 && ((x1&31)==1)) g.clear(); // for bpp==1 clear sometimes so we can see ellipses again
    if (x1&1)
      g.fillEllipse(Math.min(x1,x2), Math.min(y1,y2),Math.max(x1,x2), Math.max(y1,y2));
    else
      g.fillRect(Math.min(x1,x2), Math.min(y1,y2),Math.max(x1,x2), Math.max(y1,y2));
    g.flip();
  },30);
}
// DK08 clock font
var fname="36x70";
if (!require("Storage").read("fnt"+fname+".bin")){ (function(){
  E.kickWatchdog();
  var b=[];
  var push=function(a,s){
  a.push(require("heatshrink").decompress(atob(s)));
  };
  push(b,"/H/AAsH/gIGh/+BA0fA43/n4I+j5qGnwI/BGjF/BA/+BA0f/gIGh/4BA0HA=");
  push(b,"AH0YBA8cBA8eBA8fBDP/AA0/BH3+BA/8BA/4BA7Y/AFY");
  push(b,"jADC/H/AAMHjgIC/gICh8eBAX+BAUfj4ICA4X/n4I/BAU/AYU+BH4I0QQgI/BAX+BARUDj38BAUPBAUO/AICg4ICgwA=");
  push(b,"jADCn4DCg0cBA0OjwIGj0fBA0+BH4I/BHn/AA0/BH3+BA0f/gIGh/4BA0HA=");
  push(b,"/H/AAM/BAf8BA/+BA4HCBH4IEAAYI/BHKGDRQgI+/wIH/gIH/AIH");
  push(b,"/H/AAM/A4UG/gIGh3+BA0eA4QIEnwI+j4ECBH4I9RQgI+jwIC/wICj8cBAX8BAUPjAIC/AICg4A=");
  push(b,"/H/AAsH/gIGh/+BA0fA43/n4I+j5mCn4DCnwI/BHCGIBHUeBAX+BAUfjgIC/gICh8YBAX4BAUHA=");
  push(b,"ABEYBA8cBA8eBA8fBH4I/BHf/AA0/BH3+BA/8BA/4BA4");
  push(b,"/H//9/4ADB/8H/gEC8ADCh/+AgXxAYUfAYQIEn4ID/YIHAAYItj5mCn4DCnwI/BGiz1BBj7E/wEC+IDCj/8AgXgAYUP/ADBv/ABAUHA=");
  push(b,"/H/AAMHA4UG/gICh4ICh3+BAUfBAUeA4X/n4ICnwI+JgYI/BHKGDRQgI+/wIGj/8BA0P/AIGg4A=");
  push(b,"ACc4AYUHBAd8AQOAh4ID/wCB4EfBAf/gMA8E/BBgaIFhA+IAB4A=");
  var fg=Graphics.createArrayBuffer(72,36,1); // one font letter
  fg.setRotation(3,1);
  var dgw=36+4; // 36 + 4 pixel space
  var fnt=Graphics.createArrayBuffer(70,dgw*11,1,{msb:true}); // whole font
  fnt.setRotation(3,1);
  var w=new Uint8Array([dgw,dgw,dgw,dgw,dgw,dgw,dgw,dgw,dgw,dgw,12+2]); // widths, colon is thinner
  E.kickWatchdog();
  for (x=0,i=0;i<11;i++){fg.buffer=b[i];fnt.drawImage(fg.asImage(),x,0);x+=w[i];}
  var s=require("Storage");
  E.kickWatchdog();
  s.write("fnt"+fname+".bin",fnt.buffer);
  s.write("fnt"+fname+".wdt",w.buffer);
})(); // use anonymous function to free all memory inside
}
function setClockFont(g,name){
var s=require("Storage");
g.setFontCustom(s.read("fnt"+name+".bin"),0x30,s.read("fnt"+name+".wdt"),70);
}

var lastmin=-1;
var volts;
function drawClock(){
  var d=Date();
  volts= volts ? (volts+battVolts())/2:battVolts(); // average until shown
  if (d.getMinutes()==lastmin) return;
  d=d.toString().split(' ');
  var min=d[4].substr(3,2);
  var sec=d[4].substr(-2);
  var tm=d[4].substring(0,5);
  var hr=d[4].substr(0,2);
  lastmin=min;
  g.clear();
  var w=g.getWidth();
  g.setFont("6x8",2);
  g.setColor(15);
  var batt=battInfo(volts);volts=0;// clear average
  g.drawString(batt,w-g.stringWidth(batt)-2,0);
  //var tm=hr+" "+min;
/*
  g.drawString(hr,40-g.stringWidth(hr)/2,10);
  g.drawString(min,40-g.stringWidth(min)/2,80);
*/
  //g.setFontVector(62);
  setClockFont(g,fname);g.setColor(16); // for some reason custom font needs color+1, bug?
  //g.setFontCopasetic40x58Numeric();
  //g.drawString(hr,w/2-g.stringWidth(hr)-5,50);
  //g.drawString(min,w/2+5,50);
  g.drawString(tm,4+(w-g.stringWidth(tm))/2,48);
  //g.setColor(8+4);
  //g.setFontVector(26);
  //if (sec&1)g.drawString("o o",40-g.stringWidth("o o")/2,60);
  //if (sec&1)g.drawString(":",40-g.stringWidth(":")/2,42);
  //if (sec&1)g.drawString(". .",40-g.stringWidth(". .")/2,44);

  g.setFontVector(28);
  g.setColor(8+3);
  var dt=d[0]+" "+d[1]+" "+d[2];//+" "+d[3];
  g.drawString(dt,(w-g.stringWidth(dt))/2,130);
  g.flip();
}
function clock(){
  lastmin=-1;
  //LCD_FastMode(true);
  drawClock();
  LCD_FastMode(false);
  return setInterval(function(){
    //LCD_FastMode(true);
    drawClock();
    //LCD_FastMode(false);

  },1000);
}

// cube from https://www.espruino.com/Pixl.js+Cube+Badge
var rx = 0, ry = 0, cc = 1;
// Draw the cube at rotation rx and ry
function drawCube(xx,yy,zz) {
  // precalculate sin&cos for rotations
  var rcx=Math.cos(rx), rsx=Math.sin(rx);
  var rcy=Math.cos(ry), rsy=Math.sin(ry);
  // Project 3D into 2D
  function p(x,y,z) {
    var t;
    t = x*rcy + z*rsy;
    z = z*rcy - x*rsy;
    x=t;
    t = y*rcx + z*rsx;
    z = z*rcx - y*rsx;
    y=t;
    z += 4;
    return [xx + zz*x/z, yy + yy*y/z];
  }
  var a,b;
  // -z
  a = p(-1,-1,-1); b = p(1,-1,-1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(1,1,-1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  b = p(-1,1,-1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(-1,-1,-1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  // z
  a = p(-1,-1,1); b = p(1,-1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(1,1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  b = p(-1,1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(-1,-1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  // edges
  a = p(-1,-1,-1); b = p(-1,-1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(1,-1,-1); b = p(1,-1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(1,1,-1); b = p(1,1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
  a = p(-1,1,-1); b = p(-1,1,1);
  g.drawLine(a[0],a[1],b[0],b[1]);
}

function stepCube() {
  rx += 0.1;
  ry += 0.1;
  g.setColor(0);g.fillRect(40,40,120,120);g.setColor(1+cc);cc=(cc+1)%15;
  drawCube(80,80,80);
  g.flip();
}

// require("Font8x16").add(Graphics);

function info(){
  g.clear();
  g.setFont("6x8",2/*2*/);g.setColor(10);
  g.drawString("Espruino "+process.version,4,6);
  if (bpp==1) g.flip();
  g.setFont("6x8",1);g.setColor(14);
  g.drawString("ST7301 6bit RGB222 mode",4,22);
  if (bpp==1) g.flip();
  for (var c=0;c<8;c++){
    g.setColor(c+8);g.fillRect(8+20*c,130,28+20*c,146);
    if (bpp==1) g.flip();
  }
  for ( c=0;c<8;c++) {g.setColor(c);g.fillRect(8+20*c,148,28+20*c,164);
    if (bpp==1) g.flip();
  }
  g.flip();
  LCD_FastMode(true);
  return setInterval(function(){
    stepCube();
  },20);
}
var dayhours=Uint8Array([7,19]); // hours when backlight is not needed
function isDark(){
  var h=Date().getHours();
  return h<dayhours[0] || h>dayhours[1];
}


function drawConn(){
  g.setFont("6x8",2);g.clear();
  if (NRF.connected){
    if (!NRF.connection.RSSI) NRF.enableRSSI();
    g.drawString("CONN: "+NRF.connection.addr.substr(0,18),4,6);
        g.setFontVector(19);
    g.drawString("RSSI: "+NRF.connection.RSSI,12,150);
  } else {
    var r;
    switch (NRF.lastReason){
      case 0x13: r="USER TERMINATED";break;
      case 8: r="TIMEOUT";break;
      case undefined:r="unknown";break;
      default: r="0x"+NRF.lastReason.toString(16);
    }
    g.drawString("No connection"+(r? "\nReason: "+r:""),4,6);
  }
  g.flip();
  if (!blt && isDark()) g.bl(0.1);
}

function conn(){
  drawConn();
  return setInterval(function(){
    drawConn();
  },1000);
}

var screens=[clock,conn,info,randomShapes,randomLines];
var currscr=0;
var currint=0;
var blt=0;
var initdone=false;
setTimeout(()=>{
  ST7301_INIT();
  setTimeout(()=>{
    ST7301_INIT_NEXT();
    delayms(10);
    lcd_cmd(0x29);
    delayms(20);
    lcd_cmd(0x39);

    LCD_FastMode(true);
    //LCD_Clear();
    //LCD_FastMode(false);
    currint=clock();
    initdone=true;
//    analogWrite(BL,0.25);
//    LCD_FastMode(false);
  },250);//200
},250);//220

setWatch(function(s){
  if (!initdone) return;
  var blon=isDark();
  if (blt) { clearTimeout(blt);blt=0;} else if (blon) g.bl(0.16); // backlight on 20%
  currscr++;if (currscr>=screens.length) currscr=0;
  if (currint>0) clearInterval(currint);
    currint=screens[currscr]();
  if (blon)
    blt=setTimeout(function(){
      g.bl(0);
      blt=0;
    },5000); //backlight off after 5 seconds
},BTN1,{ repeat:true, debounce:false, edge:'rising' }
);

// for unknown devices allow connection only when holding button, then remember device in whitelist
NRF.whitelist=[];
NRF.enableRSSI=function(){
  if (NRF.connected && !NRF.connection.RSSI)
    NRF.setRSSIHandler((rssi)=>{NRF.connection.RSSI=rssi;}); //may drain battery
};
NRF.disableRSSI=function(){
  if (NRF.connection){
    NRF.setRSSIHandler();
    delete NRF.connection.RSSI;
  }
};
NRF.on('connect',function(addr) {
  if (false &&/*comment out false to use whitelist*/ !NRF.whitelist.includes(addr)){
    if (BTN1.read()){ // add to whitelist when button is held while connecting
      NRF.whitelist.push(addr);
      vibrate(1,1,100,0);
    } else
        NRF.disconnect();
  }
  NRF.connection = { addr: addr };
  NRF.connected=true;
  NRF.setTxPower(4);
});

NRF.on('disconnect',function(reason) {
  NRF.connected=false;
  NRF.connection = {};
  NRF.lastReason=reason; // google BLE hci status codes
  NRF.disableRSSI();
  NRF.setTxPower(0);
});

function BMA2x2(){
  var acc;

  function readreg(r){
    return acc.send([0x80|r,0x00],D2)[1];
  }

  function writereg(r,v){
      acc.send([0x7f & r,v],D2);
  }

  function setbit(r,b){
      var v = readreg(r);
      writereg(r,v | 1<<b);
  }

  function resetbit(r,b){
    var v = readreg(r);
    writereg(r,v & ~(1<<b));
  }

  function lowPowerMode(b){
    if (b)
      setbit(0x11,6);
    else
      resetbit(0x11,6);
  }

  function initAll(spi){
    if (spi){
      acc=spi;
    } else {
      acc=new SPI();
    acc.setup({sck:D29,miso:D31,mosi:D30,mode:0});
    }
    D2.set(); // CS
    D3.mode("input_pulldown"); // INT
    D4.mode("input_pulldown"); // INT
    D7.set(); // power on
//    D2.reset();
//    D7.reset();
//    setTimeout(()=>{
//        D7.set();
//        D2.set();
        setTimeout(()=>{
          writereg(0x21,0x0E); //latch interrupt for 50ms
          setbit(0x16,5); // single tap enable
          setbit(0x19,5); // map it to INT1
          lowPowerMode(true);
        },100);
//    },100);

  }


  function readXYZ(){
    function conv(i){
      return (i & 0x7F)-(i & 0x80);
    }
    return {
      x:conv(readreg(3)),
      y:conv(readreg(5)),
      z:conv(readreg(7))
    };
  }

/*
 acc.writeReg(0x2b,4) //tap sensitivity  (3<<6)|4
  // values are 4 is face tap, 2 side tap, 1 bottom or top side tap
  setWatch(()=>{
      var rv = acc.readReg(0x0b);
      var v = (rv&0x7f)>>4;
      v  = rv&0x80?-v:v;
//      DK08.emit("tap",v);
      print("tap",v);
  },D4,{ repeat:true, debounce:false, edge:'rising' });

*/

  return {
    init:initAll, read:readXYZ, lowPower:lowPowerMode,
    readReg:readreg,writeReg:writereg,setBit:setbit,resetBit:resetbit,
    };
}

/*
var ACCEL = ACC223();
ACCEL.init();
DK08.on("tap",(v)=>{
  console.log("Tap: "+v);
});
*/
// font chip to Espruino font conversion
// for font offsets and sizes see https://github.com/RichardBsolut/GT24L24A2Y
/*
function createFont(off,bs,w,h,c,isprop){
  var f=require("Flash");
  var fg=Graphics.createArrayBuffer(w,h,1,{vertical_byte:true}); // one letter in fontchip layout
  var fnt=Graphics.createArrayBuffer(h,w*c,1,{msb:true}); // whole font in Espruino layout
  fnt.setRotation(3,1); // needed to match espruino font layout
  off+=0x60000000;//spi flash mapped here
  var len=w*h/8;
  var x=0,i=0;
  var lw=w;
  var widths=isprop ? Uint8Array(c) : w;
  while(i<c){
    fg.buffer=f.read(len,off);off+=bs;
    if (isprop){
      lw=1+fg.buffer[0];
      widths[i]=lw;
      fg.buffer[0]=0; // real width of letter if proportional, clear
    }
    fnt.drawImage(fg.asImage(),x,0);
    x+=lw;
    i++;
    E.kickWatchdog();
  }
  const ret=fnt.buffer;
  fg=null;fnt=null;
    if (isprop){
    return { font: ret, width: widths, height:h};
  }
  return { font: ret, width: w, height:h};
}

function saveFont(name,font){
  var s=require("Storage");
  if (typeof(font.width)=="number"){
    // not proportional
    s.write(name+".bin",fnt.font);
  } else {
    flen=E.sum(fnt.width)*8;
    s.write(name+".wdt",fnt.width);
    s.write(name+".bin",new Uint8Array(fnt.font,0,flen));
  }
}
*/

/*
var fnt=createFont(0x199e0e,322,40,64,14,true);
//E.toString needs lot of unfragmented memory here, better write to storage and load from there
//g.setFontCustom(E.toString(fnt.font),0x30,E.toString(fnt.width),64);
flen=E.sum(fnt.width)*8;
var s=require("Storage");
s.write("FNT-64x40.wdt",fnt.width)
s.write("FNT-64x40.bin",new Uint8Array(fnt.font,0,flen))
g.setFontCustom(s.read("FNT-64x40.bin"),0x30,s.read("FNT-64x40.wdt"),64)
g.drawString("01234");
g.flip();
*/