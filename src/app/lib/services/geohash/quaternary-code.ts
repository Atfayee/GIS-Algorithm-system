
/**
 * 四叉树四进制Morton编码
 */
export class QuaternaryCode {

  /**
   *
   * @param row
   * @param column
   * @param deep
   */
  public encoding(row, column, deep) {
    //TODO: 请同学们完成
    let code="t";
    let template=0x1;
    template=template<<deep;
    // q(2) | r(3)
    //-------------
    // t(0) | s(1)
    for (let i = 1; i <= deep; i++) {
      template = template >> 1;
      if ((row & template) == 0x0) {
        if ((column & template) == 0x0) {
          code += "t";
        }
        else {
          code += "s";
        }
      }
      else {
        if ((column & template) == 0x0) {
          code += "q";
        }
        else {
          code += "r";
        }
      }
    }
    return code;
  }

  /**
   *
   * @param code
   */
  public decoding(code) {
    //TODO: 请同学们完成
    let row=0;
    let column=0;
    let deep=code.length-1;
    code=code.toLowerCase();
    for(let i=1;i<=code.length-1;i++){
      //  q(2) | r(3)
      //--------------
      //  t(0) | s(1)
      switch (code.charAt(i)) {
        case 't':
          row = row << 1;
          column = column << 1;
          break;
        case 's':
          row = row << 1;
          column = column << 1;
          column += 0x1;
          break;
        case 'q':
          row = row << 1;
          column = column << 1;
          row += 0x1;
          break;
        case 'r':
          row = row << 1;
          column = column << 1;
          row += 0x1;
          column += 0x1;
          break;
      
    }
    }
    
    return { 'row':row, 'column':column, 'deep':deep };
  }
}
