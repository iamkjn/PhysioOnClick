// Style contract for the AI-generated exercise illustrations.
//
// A full prompt is `${IMAGE_STYLE_PREFIX}${core}${IMAGE_STYLE_SUFFIX}` where the
// per-exercise `core` (below) is one plain phrase describing the pose to depict
// plus the region whose muscles should be shaded. The contract is a detailed
// anatomical-textbook illustration: realistic proportions, accurate joint
// positions, the working muscles subtly shaded, a single sky-blue movement
// arrow, navy outlines, no text. See docs/exercise-image-style.md.
export const IMAGE_STYLE_PREFIX =
  "Detailed medical illustration of a single human figure performing the exercise, realistic body proportions and accurate joint positions, ";
export const IMAGE_STYLE_SUFFIX =
  ", the primary working muscles subtly shaded in a warm tone, clean anatomical-textbook style, neutral pale studio background, a single sky-blue (#0EA5E9) arrow indicating the direction of movement, navy (#043246) outlines, no text, no labels, no watermark, consistent three-quarter view";

export const exerciseImagePrompts: Record<string, string> = {
  // Lower limb / knee / hip
  "ex-1": "a person rising from the front edge of a firm chair with armrests, chest leaning forward over the knees and weight driving through both feet, the quadriceps and gluteals working",
  "ex-5": "a person lying on their back lifting one straight leg about a hand's width off the floor while the other knee stays bent with the foot flat, the quadriceps on the front of the raised thigh under load",
  "ex-6": "a person lying on their back sliding one heel along the floor towards the buttock to bend the knee, a folded towel under the heel, the hamstrings and quadriceps around the knee working",
  "ex-7": "a person standing with feet hip-width and fingertips resting on a worktop, bending the hips and knees into a shallow squat, the quadriceps and gluteals working",
  "ex-11": "a person lying on their back with knees bent and feet flat lifting the hips into a bridge, the gluteal muscles across the buttocks and the hamstrings working",
  "ex-16": "a person seated upright on a stationary exercise bike pedalling with only a light knee bend at the lowest point, the quadriceps at the front of the thighs working",
  "ex-53": "a person standing with a resistance band looped behind one slightly bent knee, straightening that knee fully against the band, the inner quadriceps just above the kneecap working",
  "ex-54": "a person stepping up onto a low step leading with one foot and straightening that leg to lift the body, the quadriceps and gluteals of the leading leg working",
  "ex-55": "a person lying on their side with hips and knees bent and the feet together, lifting the top knee open like a clam, the gluteus medius on the upper outer hip working",
  "ex-56": "a person lying on their side with both legs straight, lifting the top leg upward in line with the body, the gluteal muscles on the upper outer hip working",
  "ex-57": "a person in a split stance with one leg well behind, tucking the pelvis under and easing the hips forward, the muscles at the front of the trailing hip and thigh stretching",
  "ex-58": "a person holding a sturdy rail and lowering into a deep squat with the feet wider than hip-width and toes turned slightly out, the hip and thigh muscles working through range",
  "ex-65": "a person with the back flat against a wall sliding down into a seated position and holding it with the knees bent to about a right angle, the quadriceps at the front of both thighs under sustained load",
  "ex-66": "a person in a split stance with the back heel lifted lowering straight down until the back knee nears the floor, the quadriceps and gluteals of the front leg working",
  "ex-67": "a person in a quarter squat with a resistance loop around the legs stepping sideways against the band with steady tension, the gluteus medius on the outer hips working",
  "ex-68": "a person kneeling upright with the ankles held down, lowering the straight rigid body slowly forward towards the floor, the hamstrings at the back of the thighs under heavy load",
  "ex-69": "a person standing with one heel on a low step and that leg straight, hinging forward from the hips with a flat back, the hamstring at the back of the raised thigh stretching",
  "ex-70": "a person standing on a low box slowly lowering the opposite foot towards the floor by bending the standing knee, the quadriceps and gluteals of the standing leg controlling the descent",

  // Ankle / calf
  "ex-12": "a person standing tall with fingertips resting lightly on a kitchen counter for balance, rising up onto the balls of both feet with the heels lifted high, the calf muscles at the back of the lower legs under load",
  "ex-59": "two side-by-side panels of the same person seated with the injured leg raised on a cushion, one panel pointing the foot away and one pulling the toes and foot back towards the shin, the muscles at the front and back of the lower leg working",
  "ex-60": "a person seated with one foot lifted off the floor tracing the letters of the alphabet in the air with the big toe, the movement coming only from the ankle, the lower leg muscles working through range",
  "ex-61": "a person seated with the leg out straight and a resistance band around the outside of the foot anchored to the opposite side, turning the sole of the foot outward against the band, the muscles on the outer lower leg working",
  "ex-62": "a person balancing on one leg on a soft cushion with the other foot lifted clear and fingertips hovering near a wall for safety, the ankle and hip stabiliser muscles working",
  "ex-63": "a person standing facing a wall with one leg stepped straight back, that heel flat and knee straight, leaning the hips towards the wall, the calf muscle at the back of the rear lower leg stretching",
  "ex-64": "a person standing on the edge of a step with the balls of both feet on the step and the heels off the back, holding a handrail, slowly lowering one heel below the level of the step, the calf and Achilles tendon of that leg under load",
  "ex-103": "a person lying in bed with the legs straight and calves resting on the mattress, pointing both feet away and then pulling them back up towards the shins, the calf and shin muscles pumping",
  "ex-115": "a person standing on a wobble board with both feet hip-width while holding a rail, keeping the board level, the ankle and lower leg stabiliser muscles working",

  // Shoulder / scapula
  "ex-2": "a seated person viewed from behind drawing both shoulder blades down and gently together, the lower trapezius and the rhomboids between the shoulder blades working",
  "ex-8": "a person standing tall raising one straight arm forwards and up overhead as far as is comfortable with the thumb leading, the deltoid and the muscles around the shoulder blade working",
  "ex-9": "a person leaning forward from the hips with one hand resting on a table and the other arm hanging relaxed towards the floor, letting it swing in a small circle, the shoulder muscles kept loose",
  "ex-35": "a person standing side-on holding a resistance band with the working elbow tucked against the side over a rolled towel, rotating the forearm outward away from the stomach, the rotator cuff muscles at the back of the shoulder working",
  "ex-36": "a person standing side-on holding a resistance band with the working elbow tucked against the side over a rolled towel, rotating the forearm inward across the stomach, the muscles at the front of the shoulder and chest working",
  "ex-37": "a person facing a wall with both forearms and hands flat against it in a goalpost shape, sliding the arms slowly upward while keeping contact, the muscles around the shoulder blades working",
  "ex-38": "a person lying on the stiff shoulder with that arm out in front bent to a right angle, the other hand gently pressing the forearm down towards the floor, the back of the shoulder stretching",
  "ex-39": "a person lying face down with the forehead on a rolled towel lifting the arms off the floor to form a Y then a T then a W shape, the muscles between and below the shoulder blades working",
  "ex-47": "a seated person pulling a resistance band towards the ribs by drawing the elbows back and squeezing the shoulder blades together, the mid-back and rhomboid muscles working",
  "ex-48": "a person seated tall pressing a light weight in each hand from shoulder height straight up overhead, the deltoids and triceps working",
  "ex-50": "a person leaning forward from the hips with one hand on a table and the other arm hanging while holding a light weight, swinging it in small circles, the shoulder muscles kept relaxed",
  "ex-51": "a person drawing one arm across the front of the chest at shoulder height with the other forearm hooked over it to pull it closer, the back of the shoulder stretching",
  "ex-52": "a person at the top of a straight-bodied push-up position pushing a little further so the upper back rounds and the shoulder blades spread apart, the serratus muscles along the ribs under the shoulder blades working",
  "ex-108": "a person leaning forward from the hips with one hand on a chair and the operated arm hanging loose and heavy, letting it swing in a small circle, the shoulder muscles kept relaxed",
  "ex-109": "a person lying on their back holding a light stick in both hands and using the good arm to guide the operated arm up overhead, the operated shoulder kept passive",

  // Elbow / wrist / hand
  "ex-40": "a seated person with the upper arm resting on a table bending and straightening the elbow through its full range, the biceps and triceps of the upper arm working",
  "ex-41": "a person holding one arm straight out in front palm down and using the other hand to bend the wrist downward, the muscles on the top of the forearm stretching",
  "ex-42": "a seated person with the forearm resting on a table palm down holding a light dumbbell, slowly lowering the weight by dropping the wrist, the muscles on the top of the forearm under load",
  "ex-43": "a person holding one arm straight out in front with the palm facing forward and using the other hand to draw the fingers back, the muscles on the underside of the forearm stretching",
  "ex-44": "a seated person with the forearm resting on a table squeezing a soft ball in the palm, the muscles of the hand and the underside of the forearm working",
  "ex-45": "a person holding the wrist straight and moving the fingers through a sequence of straight, hooked and full fist shapes, the finger tendons gliding through the palm",
  "ex-46": "a person with one arm out to the side at shoulder height palm up, gently extending the wrist and fingers back and then releasing, mobilising the median nerve along the forearm",
  "ex-49": "a person standing with one palm flat on a table and the elbow straight, leaning body weight forward through the extended wrist, the forearm and wrist muscles loaded",

  // Lumbar spine / core
  "ex-3": "a person lying on their back with knees bent and feet flat, hips lifted so the body forms a straight line from shoulders to knees, the gluteals and hamstrings along the back of the hips and thighs working",
  "ex-14": "a person lying on their back with both arms reaching straight up and hips and knees bent to right angles, lowering one opposite arm and leg towards the floor, the deep abdominal muscles holding the lower back still",
  "ex-15": "a person on hands and knees extending one arm forward and the opposite leg straight back, level with the flat back, the spinal extensors and gluteals along the back working",
  "ex-17": "a person lying face down pressing the chest up on straightening arms with the hips and legs relaxed on the mat, the lower back gently extended, the muscles either side of the lumbar spine working lightly",
  "ex-18": "a person standing with the hands supporting the lower back, leaning the upper body gently backwards into extension, the muscles either side of the lower spine working",
  "ex-24": "a person lying face down lifting the chest and forehead a small way off the mat with the arms by the sides, palms turned outward and shoulder blades drawn together, the muscles of the upper back and lower spine working",
  "ex-25": "a person in a side-lying position propped on one forearm with the knees bent, lifting the hips so the body is a straight line from head to knees, the side abdominal and hip muscles working",
  "ex-26": "a person on a mat rolling smoothly from lying on the back onto the side one body segment at a time, the abdominal and trunk muscles controlling the turn",
  "ex-27": "a person lying on their back with knees bent gently tilting the pelvis to flatten the lower back towards the floor, the lower abdominal muscles working",
  "ex-28": "a person on hands and knees reaching one arm forward and the opposite leg back then drawing that elbow and knee together under the body, the deep abdominal and back muscles working",
  "ex-31": "a person lying on their back drawing both bent knees up towards the chest with the hands behind the thighs, the lower back rounding and the muscles of the lumbar spine stretching",
  "ex-32": "a seated person straightening one knee forward while lifting the head to look up, then bending the knee while tucking the chin, gently gliding the sciatic nerve down the back of the leg",
  "ex-34": "a person hinging at the hips with a flat back and slightly bent knees to lift a light box from the floor and keep it close to the body, the gluteals and thigh muscles doing the work",

  // Thoracic spine
  "ex-19": "a person on hands and knees alternately rounding the spine up towards the ceiling and letting it sag into a gentle arch, the muscles all along the spine moving through range",
  "ex-20": "a person lying on their side with the knees drawn up, opening the top arm across the body to rotate the upper back towards the floor behind, the muscles around the mid-back stretching",
  "ex-33": "a person standing with the back against a wall sliding both arms up and down the wall in a goalpost shape while keeping contact, the muscles between and below the shoulder blades working",

  // Cervical spine / neck
  "ex-13": "a seated person viewed in profile gliding the head and chin straight backwards to make a gentle double chin, the deep muscles at the front of the neck working",
  "ex-21": "a seated person turning the head slowly to look over one shoulder, the muscles along the side and back of the neck working through range",
  "ex-22": "a seated person tilting one ear down towards that shoulder while the opposite hand holds the chair seat, the muscles along the side of the neck stretching",
  "ex-23": "a seated person pressing one palm against the side of the head and resisting so the head does not move, the deep neck muscles working without movement",
  "ex-29": "a person standing with the back of the head against a wall gliding the chin straight back to press the head lightly into the wall, the deep muscles at the front of the neck working",
  "ex-30": "a seated person holding the chair seat with one hand and turning the nose down towards the opposite armpit with light overpressure from the other hand, the muscle from the neck to the shoulder blade stretching",

  // Balance / gait
  "ex-4": "a person standing with one foot placed directly in front of the other in a heel-to-toe line and a hand resting lightly on a kitchen worktop, the ankle and hip stabiliser muscles working",
  "ex-10": "a person standing on one leg beside a worktop with one hand resting on it and the other foot lifted clear of the floor, the standing hip and ankle stabilisers working",
  "ex-71": "a person standing tall with the feet together and eyes open beside a worktop kept within reach, the ankle and hip balance muscles working",
  "ex-72": "a person standing with the feet together and the eyes closed and one hand resting on a worktop, the ankle and trunk balance muscles working",
  "ex-73": "a person standing with the hands resting on a worktop shifting body weight slowly from one foot to the other, the hip and ankle muscles controlling the sway",
  "ex-74": "a person stepping sideways along a worktop while trailing the fingertips on it for support, the outer hip muscles working with each side step",
  "ex-75": "a person walking slowly along a straight floor line placing the heel of each foot directly in front of the toes of the other, the ankle and hip stabilisers working",
  "ex-76": "a person standing behind a worktop with the hands resting on it marching on the spot and lifting alternate knees to hip height, the hip flexors and standing leg muscles working",
  "ex-77": "a person walking slowly backwards while trailing one hand along a wall, the hip and calf muscles working to control each backward step",
  "ex-78": "a person rising from a firm chair with the arms folded across the chest and then sitting back down with control, the quadriceps and gluteals working",
  "ex-79": "a person stepping over a line of low soft obstacles one at a time beside a worktop, lifting each knee high to clear them, the hip flexors and balance muscles working",
  "ex-80": "a person climbing a stair while holding the handrail, leading with one leg, the quadriceps and gluteals of that leg lifting the body",
  "ex-81": "a person balancing on one slightly bent leg while reaching an arm out to the side and forward, the standing hip and ankle stabilisers working",
  "ex-82": "a person walking at a steady pace on a treadmill with the handrails within reach, an even stride through both legs, the hip and calf muscles working",
  "ex-83": "a person standing on one leg at a worktop with one hand resting on it and the other foot lifted just clear of the floor, the standing hip stabilisers working",
  "ex-84": "a person turning slowly through a half circle taking small even steps with a worktop within reach, the hip and trunk muscles controlling the turn",
  "ex-85": "a person walking steadily along a level path while counting on the fingers of one hand, an even stride through both legs, the balance muscles working",
  "ex-86": "a person walking carefully across a short stretch of uneven grass with a helper alongside, the ankle and hip stabiliser muscles working over the changing ground",

  // Neuro rehab
  "ex-87": "a person lying on a bed with the knees bent rolling onto one side by reaching the top arm across and letting the knees follow, the trunk and abdominal muscles turning the body",
  "ex-88": "a person lying on their back with the knees bent lifting the hips clear of the bed, the gluteal and hamstring muscles at the back of the hips working",
  "ex-89": "a person rising from the front of a chair with armrests, leaning the chest forward over the knees and pushing through both feet, the quadriceps and gluteals working",
  "ex-90": "a person standing at a worktop holding on with one hand while shifting body weight onto the affected leg, the hip, thigh and calf muscles of that leg loaded",
  "ex-91": "a seated person at a table sliding and reaching the affected arm across the surface towards a light object, the shoulder and upper arm muscles working",
  "ex-92": "a person standing tall making a large deliberate whole-body movement, reaching one arm high overhead while stepping wide, the shoulder, trunk and leg muscles working through full range",
  "ex-93": "a person standing beside a worktop stepping on the spot in time to a steady beat and lifting each knee clearly, the hip flexors and leg muscles working",
  "ex-94": "a person moving gently between standing by a chair and sitting to rest, pacing an easy circuit of small movements, the leg and trunk muscles working lightly",
  "ex-95": "a seated person moving one index finger back and forth between a target held at a full arm reach and the tip of the nose, the arm and shoulder muscles controlling the reach",
  "ex-96": "a person lying on their back placing one heel on the opposite knee and sliding it smoothly down the shin to the ankle, the hip and thigh muscles controlling the movement",
  "ex-97": "a person standing in front of a mirror with the feet hip-width keeping the shoulders and hips level while watching the reflection, the trunk and hip balance muscles working",
  "ex-98": "a seated person at a table picking up an everyday object with the affected hand and placing it down again, the muscles of the hand and forearm opening and closing the grip",
  "ex-99": "a person walking along a clear walkway stepping onto evenly spaced floor markers with a helper alongside, an even stride through both legs, the hip and leg muscles working",
  "ex-100": "a seated person with the arms crossed over the chest rotating the upper body slowly to look behind on each side, the oblique abdominal muscles around the waist working",
  "ex-101": "a person held upright in a supported standing frame with the straps and supports fitted, the legs and trunk bearing weight through the frame",
  "ex-102": "a person standing at a worktop stepping side to side while naming items from a list, the leg and trunk muscles working during the divided-attention task",

  // Post-op
  "ex-104": "a person with one leg straight out tightening the thigh to press the back of the knee down towards the floor, the quadriceps above the kneecap contracting without movement",
  "ex-105": "a person sitting with the legs out straight using a strap around the foot to draw the heel towards the buttock and bend the operated knee, the muscles around the knee moving through range",
  "ex-106": "a person lying on their back sliding one straight leg out to the side along the bed and back to the middle, the gluteal muscles on the outer hip working",
  "ex-107": "a person rising from the edge of a high bed to stand upright while holding a walking frame, the thigh and gluteal muscles of both legs working",
  "ex-110": "a close view of fingertips making small circles over a healed surgical scar on the skin, gently moving the tissue in each direction",
  "ex-111": "a person standing while holding a rail and pressing the foot of the healing leg down onto a set of bathroom scales to a target weight, the thigh and calf muscles of that leg loading gradually",
  "ex-112": "a person lying on their back with the knees bent gently drawing the lower abdomen inward while breathing normally, the deep abdominal muscles working softly",
  "ex-113": "a person walking at an easy pace on a flat path with a walking aid, an even stride through both legs, the hip and leg muscles working",
  "ex-114": "a seated person straightening one knee against a resistance band looped around the ankle and anchored behind the chair, the quadriceps at the front of the thigh working",
  "ex-116": "a person moving through a small circuit of a sit-to-stand from a box, a step-up and a band pull, the leg, hip and back muscles working across the stations",
  "ex-117": "a person sitting upright while holding a firm pillow against the chest wound and taking a slow deep breath that expands the ribcage, the diaphragm and rib muscles working",
  "ex-118": "a person sitting in a parked car turning the head and upper body to check over each shoulder and pressing the pedals, the neck, trunk and leg muscles working",

  // Pelvic health
  "ex-119": "a cutaway side view of the pelvis of a seated person gently drawing the pelvic floor muscles up and in, the sling of muscle across the base of the pelvis highlighted",
  "ex-120": "a cutaway side view of the pelvis showing the pelvic floor muscles held in a sustained lift, the sheet of muscle across the base of the pelvis highlighted",
  "ex-121": "a cutaway side view of the pelvis showing a quick strong lift of the pelvic floor muscles timed with a cough, the base of the pelvis highlighted",
  "ex-122": "a person lying on their back with the knees bent and a hand on the lower abdomen drawing the pelvic floor and deep tummy muscles gently in together, the lower abdominal wall highlighted",
  "ex-123": "a person lying on their back holding a towel wrapped across the abdomen and gently lifting the head and shoulders a small way while drawing the tummy flat, the deep abdominal muscles working",
  "ex-124": "a cutaway side view of the pelvis of a person lying with the knees bent letting the pelvic floor muscles fully release and lengthen downward, the base of the pelvis highlighted",
  "ex-125": "a side view of a person lying with the knees bent breathing so the belly and lower ribs expand while the chest stays still, the domed diaphragm under the ribs highlighted",
  "ex-126": "a person lying on their back with the knees bent lifting the hips into a bridge while holding a gentle pelvic floor lift, the gluteal muscles and the pelvic floor working together",
  "ex-127": "a person lowering into a squat with the feet a little wider than hip-width and breathing out to lift the pelvic floor while rising, the gluteal and thigh muscles working",
  "ex-128": "a pregnant person standing with the back against a wall tilting the pelvis to flatten the lower back towards the wall, the lower abdominal and gluteal muscles working",
  "ex-129": "a pregnant person lying on their side with a pillow between the knees and supporting the bump, lifting the top knee upward, the gluteus medius on the outer hip working",
  "ex-130": "a person hopping on the spot and jogging on the spot on a firm floor as a readiness check, the calf, thigh and pelvic floor muscles working",
  "ex-131": "a side view of a person seated on a toilet with the feet raised on a low footstool so the knees are above the hips, leaning forward with the forearms on the thighs, the abdominal wall relaxed",
  "ex-132": "a cutaway side view of the pelvis of a person lying with the knees bent gently bulging and lengthening the pelvic floor muscles downward, the base of the pelvis highlighted",

  // Paediatric
  "ex-133": "a child moving on all fours in a bear crawl along a soft floor between two markers, the shoulder, arm and leg muscles working",
  "ex-134": "a child walking heel to toe along a straight taped line on the floor with the arms held out for balance, the ankle and hip stabiliser muscles working",
  "ex-135": "a child catching a large soft ball with both hands and preparing to throw it back, the shoulder, arm and trunk muscles working",
  "ex-136": "a child crawling on hands and knees under a low blanket bridge as part of an obstacle course, the shoulder, core and hip muscles working",
  "ex-137": "a child walking on tiptoes along a short path with the heels lifted high, the calf muscles at the back of the lower legs working",
  "ex-138": "a child bouncing gently on a small trampette while holding the support bar with an adult standing close, the calf, thigh and core muscles working",
  "ex-139": "a child lying on the tummy lifting the arms, chest and legs off the floor to reach for a toy in front, the muscles all along the back working",
  "ex-140": "a child lying on the tummy on a scooter board pulling along a smooth floor with both hands, the shoulder, arm and back muscles working",
  "ex-141": "a child hopping on one leg between floor spots in a hopscotch pattern, the calf, thigh and hip muscles of the hopping leg working",
  "ex-142": "a child moving through a set of simple movement stations in order, crawling then balancing then jumping, the whole body working across the circuit",

  // General / chronic pain / return to sport
  "ex-143": "a person standing with feet hip-width rolling the shoulders and gently circling the arms and hips through easy range, the muscles around each joint warming up",
  "ex-144": "a person walking at a brisk comfortable pace along a flat path, an even stride through both legs, the hip, thigh and calf muscles working",
  "ex-145": "a person standing tall reaching both arms overhead into a long full-body lengthening stretch, the muscles along the sides of the trunk and the shoulders stretching",
  "ex-146": "a person performing a chair squat, lowering the hips back towards a chair seat while the arms reach forward for balance, the quadriceps and gluteals working",
  "ex-147": "a person standing at a kitchen worktop doing a paced everyday task such as chopping vegetables and pausing before pain builds, the trunk and arm muscles working at an easy level",
  "ex-148": "a person bending forward from the hips and knees to reach towards the floor with a calm relaxed posture, the back, hip and thigh muscles working through the feared range",
  "ex-149": "a person accelerating into a run and cutting to change direction between two markers, the thigh, calf and hip muscles working through the sprint and turn",
  "ex-150": "a person lying on their back with the knees bent and one hand on the chest and one on the tummy breathing slowly and deeply, the belly rising as the diaphragm works",

  // Competitive pass: elbow / hip / neck / calf / knee loading
  "ex-151": "a seated person with the forearm resting on a table palm up holding a light dumbbell, slowly lowering the weight by letting the wrist bend back, the muscles on the underside of the forearm under load",
  "ex-152": "a seated person with the forearm resting on a table palm up holding a light dumbbell, curling the wrist up towards the body against the weight, the forearm flexor muscles on the underside of the forearm working",
  "ex-153": "a seated person with the forearm resting on a table and the elbow bent to a right angle holding a hammer by one end, slowly rotating the forearm to turn the palm up then down, the muscles that twist the forearm working",
  "ex-154": "a seated person with the forearm resting on a table palm down holding a light dumbbell, lifting the back of the hand up and lowering it slowly, the muscles on the top of the forearm under load",
  "ex-155": "a standing person holding a flexible rubber exercise bar in both hands, one wrist bent back holding a twist while the other hand slowly releases it, the wrist extensor muscles on the top of the forearm working",
  "ex-156": "a person standing sideways on a step on one leg with the other foot hanging free, slowly dropping and then lifting the free-side hip to level the pelvis, the gluteus medius on the side of the standing hip working",
  "ex-157": "a person seated on a chair with a loop band around both thighs above the knees, slowly pressing the knees apart against the band, the deep outer-hip rotators and gluteal muscles working",
  "ex-158": "a person lying on their side propped on one forearm with the top ankle and shin resting on a bench, lifting the hips into a straight line, the inner-thigh adductor muscles of the top leg and the side of the lower hip working",
  "ex-159": "a person lying on their back with one knee bent and foot flat and the other knee hugged towards the chest, lifting the hips into a bridge on the single supporting leg, the gluteal muscles of that leg working",
  "ex-160": "a person standing tall beside a worktop with a loop band around both ankles, moving one straight leg out to the side against the band while balancing on the other, the outer-hip muscles of both legs working",
  "ex-161": "a person lying on their back with knees bent making a small gentle chin nod that flattens the neck towards the floor and holding it, the deep muscles at the front of the neck working",
  "ex-163": "a person lying face down on a bench with the head and neck past the edge, slowly lifting the head until it is level with the body with the chin tucked, the muscles at the back of the neck working",
  "ex-164": "a person standing with the balls of both feet on the edge of a step holding a rail and wearing a loaded rucksack, slowly lowering the heels below the step and rising onto the toes, the calf muscles and Achilles tendon under heavy load",
  "ex-165": "a seated person with the knees bent to a right angle and a weight resting across the thighs, raising and lowering the heels with the balls of the feet on a low block, the deep soleus calf muscle low on the lower leg working",
  "ex-166": "a person in a held squat with a strong band looped behind both knees and anchored in front, the shins kept vertical and the knees bent to a right angle, the quadriceps at the front of both thighs under sustained load",
  "ex-167": "a person kneeling upright on a mat with the body in a straight line from knees to head, leaning slowly backwards from the knees under control, the quadriceps along the front of the thighs under lengthening load",

  // Face (adapt the suffix mentally: close-up, both sides shown, no movement arrow)
  "face-smile": "close-up medical illustration of a face gently raising both corners of the mouth into a smile, both sides shown for symmetry, the muscles around the mouth and cheeks working",
  "face-brow-raise": "close-up medical illustration of a face raising both eyebrows high to wrinkle the forehead, both sides shown for symmetry, the forehead muscles working",
  "face-eye-close": "close-up medical illustration of a face softly closing both eyes without screwing them up, both sides shown for symmetry, the ring of muscle around each eye working",
  "face-cheek-puff": "close-up medical illustration of a face puffing both cheeks with air and holding the lips sealed, both sides shown for symmetry, the cheek and lip muscles working",
  "face-frown": "close-up medical illustration of a face drawing both eyebrows down and together into a frown, both sides shown for symmetry, the muscles between the eyebrows working",
  "face-big-smile": "close-up medical illustration of a face making a wide full smile that shows the teeth, both sides shown for symmetry, the cheek and mouth muscles working",
  "face-eye-wide": "close-up medical illustration of a face opening both eyes as wide as possible with the eyebrows lifted, both sides shown for symmetry, the eyelid and forehead muscles working",
  "face-pucker": "close-up medical illustration of a face pushing both lips forward into a tight pucker as if to whistle, both sides shown for symmetry, the ring of muscle around the lips working",
};

export function hasImagePrompt(id: string): boolean {
  return typeof exerciseImagePrompts[id] === "string";
}
export function fullImagePrompt(id: string): string | null {
  const core = exerciseImagePrompts[id];
  return core ? `${IMAGE_STYLE_PREFIX}${core}${IMAGE_STYLE_SUFFIX}` : null;
}

/**
 * Exercise ids whose illustration has actually been generated, clinically
 * reviewed, and uploaded to Storage (`exercise-images/{id}.png`). This is the
 * gate the web card and the PDF use to decide "show the real image" vs "fall
 * back to the stick figure". It is deliberately NOT `hasImagePrompt`, because
 * a prompt can be authored (this file) long before the image is live. Add an
 * id here in the same commit that runs `scripts/upload-exercise-images.ts`
 * for it.
 */
export const uploadedImageIds: ReadonlySet<string> = new Set<string>([
  // batch 1 + batch A: prompts authored, generation blocked on image-gen API
]);

export function hasUploadedImage(id: string): boolean {
  return uploadedImageIds.has(id);
}
