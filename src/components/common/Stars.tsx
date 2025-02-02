/** @jsxImportSource theme-ui **/
import styles from "./styles";

import { Flex } from "theme-ui";

type BadgeProps = {
  count: number;
  onDark?: boolean;
  large?: boolean;
  onClick?: () => void;
};

const Stars = ({ count, large, onClick }: BadgeProps) => {
  return (
    <Flex
      onClick={onClick}
      className={"stars" + large ? "large" : ""}
      sx={styles.star}
    >
      <img className="star" src="/images/star.svg" />
      <div className="star-count">{count}</div>
    </Flex>
  );
};

export default Stars;
