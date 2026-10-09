//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_statistics_dto_class_top_labels_inner.g.dart';

/// DashboardStatisticsDtoClassTopLabelsInner
///
/// Properties:
/// * [name] 
/// * [count] 
@BuiltValue()
abstract class DashboardStatisticsDtoClassTopLabelsInner implements Built<DashboardStatisticsDtoClassTopLabelsInner, DashboardStatisticsDtoClassTopLabelsInnerBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'count')
  num get count;

  DashboardStatisticsDtoClassTopLabelsInner._();

  factory DashboardStatisticsDtoClassTopLabelsInner([void updates(DashboardStatisticsDtoClassTopLabelsInnerBuilder b)]) = _$DashboardStatisticsDtoClassTopLabelsInner;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardStatisticsDtoClassTopLabelsInnerBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardStatisticsDtoClassTopLabelsInner> get serializer => _$DashboardStatisticsDtoClassTopLabelsInnerSerializer();
}

class _$DashboardStatisticsDtoClassTopLabelsInnerSerializer implements PrimitiveSerializer<DashboardStatisticsDtoClassTopLabelsInner> {
  @override
  final Iterable<Type> types = const [DashboardStatisticsDtoClassTopLabelsInner, _$DashboardStatisticsDtoClassTopLabelsInner];

  @override
  final String wireName = r'DashboardStatisticsDtoClassTopLabelsInner';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardStatisticsDtoClassTopLabelsInner object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardStatisticsDtoClassTopLabelsInner object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DashboardStatisticsDtoClassTopLabelsInnerBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.count = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardStatisticsDtoClassTopLabelsInner deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardStatisticsDtoClassTopLabelsInnerBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

